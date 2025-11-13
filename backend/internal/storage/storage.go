package storage

import (
	"crypto/sha256"
	"encoding/hex"
	"sync"
	"time"
)

// Order represents a trading order
type Order struct {
	ID        string    `json:"id"`
	Username  string    `json:"username"`
	Symbol    string    `json:"symbol"`
	Side      string    `json:"side"`      // "buy" or "sell"
	OrderType string    `json:"orderType"` // "market" or "limit"
	Quantity  int       `json:"quantity"`
	Price     float64   `json:"price"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"createdAt"`
}

// StockPrice represents the current price of a stock
type StockPrice struct {
	Symbol       string    `json:"symbol"`
	Price        float64   `json:"price"`
	Change       float64   `json:"change"` // percentage change
	PriceHistory []float64 `json:"priceHistory"`
	Logo         string    `json:"logo"`
	Name         string    `json:"name"`
}

// UserAccount represents a user's trading account
type UserAccount struct {
	Username     string         `json:"username"`
	PasswordHash string         `json:"-"` // Don't expose in JSON
	Credits      float64        `json:"credits"`
	Portfolio    map[string]int `json:"portfolio"` // symbol -> quantity
	mutex        sync.RWMutex
}

// Storage provides thread-safe in-memory storage
type Storage struct {
	orders      []Order
	ordersMutex sync.RWMutex

	prices      map[string]*StockPrice
	pricesMutex sync.RWMutex

	accounts      map[string]*UserAccount
	accountsMutex sync.RWMutex
}

var instance *Storage
var once sync.Once

// GetInstance returns the singleton storage instance
func GetInstance() *Storage {
	once.Do(func() {
		instance = &Storage{
			orders:   make([]Order, 0),
			prices:   make(map[string]*StockPrice),
			accounts: make(map[string]*UserAccount),
		}
		// Initialize mock stock prices with logos
		instance.prices["AAPL"] = &StockPrice{
			Symbol:       "AAPL",
			Price:        150.00,
			Change:       0.0,
			PriceHistory: []float64{150.00},
			Logo:         "https://logo.clearbit.com/apple.com",
			Name:         "Apple Inc.",
		}
		instance.prices["TSLA"] = &StockPrice{
			Symbol:       "TSLA",
			Price:        250.00,
			Change:       0.0,
			PriceHistory: []float64{250.00},
			Logo:         "https://logo.clearbit.com/tesla.com",
			Name:         "Tesla, Inc.",
		}
		instance.prices["AMZN"] = &StockPrice{
			Symbol:       "AMZN",
			Price:        135.00,
			Change:       0.0,
			PriceHistory: []float64{135.00},
			Logo:         "https://logo.clearbit.com/amazon.com",
			Name:         "Amazon.com, Inc.",
		}
		instance.prices["GOOGL"] = &StockPrice{
			Symbol:       "GOOGL",
			Price:        140.00,
			Change:       0.0,
			PriceHistory: []float64{140.00},
			Logo:         "https://logo.clearbit.com/google.com",
			Name:         "Alphabet Inc.",
		}
		instance.prices["MSFT"] = &StockPrice{
			Symbol:       "MSFT",
			Price:        380.00,
			Change:       0.0,
			PriceHistory: []float64{380.00},
			Logo:         "https://logo.clearbit.com/microsoft.com",
			Name:         "Microsoft Corporation",
		}
	})
	return instance
}

// hashPassword creates a SHA-256 hash of the password
func hashPassword(password string) string {
	hash := sha256.Sum256([]byte(password))
	return hex.EncodeToString(hash[:])
}

// CreateAccount creates a new user account with initial credits
func (s *Storage) CreateAccount(username, password string) *UserAccount {
	s.accountsMutex.Lock()
	defer s.accountsMutex.Unlock()

	if _, exists := s.accounts[username]; exists {
		return nil // Account already exists
	}

	s.accounts[username] = &UserAccount{
		Username:     username,
		PasswordHash: hashPassword(password),
		Credits:      2000.0,
		Portfolio:    make(map[string]int),
	}
	return s.accounts[username]
}

// ValidatePassword checks if the provided password matches the stored hash
func (s *Storage) ValidatePassword(username, password string) bool {
	s.accountsMutex.RLock()
	defer s.accountsMutex.RUnlock()

	account, exists := s.accounts[username]
	if !exists {
		return false
	}

	return account.PasswordHash == hashPassword(password)
}

// GetAccount returns a user's account
func (s *Storage) GetAccount(username string) *UserAccount {
	s.accountsMutex.RLock()
	defer s.accountsMutex.RUnlock()
	return s.accounts[username]
}

// AddOrder adds a new order to storage
func (s *Storage) AddOrder(order Order) {
	s.ordersMutex.Lock()
	defer s.ordersMutex.Unlock()
	s.orders = append(s.orders, order)
}

// GetOrders returns all orders for a user
func (s *Storage) GetOrders(username string) []Order {
	s.ordersMutex.RLock()
	defer s.ordersMutex.RUnlock()

	userOrders := make([]Order, 0)
	for _, order := range s.orders {
		if order.Username == username {
			userOrders = append(userOrders, order)
		}
	}
	return userOrders
}

// UpdatePrice updates a stock price
func (s *Storage) UpdatePrice(symbol string, newPrice, change float64) {
	s.pricesMutex.Lock()
	defer s.pricesMutex.Unlock()
	if price, exists := s.prices[symbol]; exists {
		price.Price = newPrice
		price.Change = change
		// Add to history and keep only last 20
		price.PriceHistory = append(price.PriceHistory, newPrice)
		if len(price.PriceHistory) > 20 {
			price.PriceHistory = price.PriceHistory[len(price.PriceHistory)-20:]
		}
	}

	// Check and update order statuses
	s.updateOrderStatuses(symbol, newPrice)
}

// ExecuteBuyOrder executes a buy order with proper validation
func (s *Storage) ExecuteBuyOrder(username, symbol string, quantity int, price float64, orderType string) error {
	account := s.GetAccount(username)
	if account == nil {
		return &OrderError{"Account not found"}
	}

	// For market orders, use current market price
	actualPrice := price
	if orderType == "market" {
		stockPrice, exists := s.GetPrice(symbol)
		if !exists {
			return &OrderError{"Stock not found"}
		}
		actualPrice = stockPrice.Price
	}

	totalCost := float64(quantity) * actualPrice

	account.mutex.Lock()
	defer account.mutex.Unlock()

	if account.Credits < totalCost {
		return &OrderError{"Insufficient credits"}
	}

	// For market orders, execute immediately
	if orderType == "market" {
		account.Credits -= totalCost
		account.Portfolio[symbol] += quantity
		return nil
	}

	// For limit orders, just validate credits (execution happens when price condition is met)
	return nil
}

// ExecuteSellOrder executes a sell order with proper validation
func (s *Storage) ExecuteSellOrder(username, symbol string, quantity int, price float64, orderType string) error {
	account := s.GetAccount(username)
	if account == nil {
		return &OrderError{"Account not found"}
	}

	account.mutex.Lock()
	defer account.mutex.Unlock()

	// Check if user has enough stocks
	if account.Portfolio[symbol] < quantity {
		return &OrderError{"Insufficient stocks to sell"}
	}

	// For market orders, execute immediately
	if orderType == "market" {
		stockPrice, exists := s.GetPrice(symbol)
		if !exists {
			return &OrderError{"Stock not found"}
		}

		totalRevenue := float64(quantity) * stockPrice.Price
		account.Credits += totalRevenue
		account.Portfolio[symbol] -= quantity

		// Remove from portfolio if quantity becomes 0
		if account.Portfolio[symbol] == 0 {
			delete(account.Portfolio, symbol)
		}
		return nil
	}

	// For limit orders, just remove stocks from available inventory
	// (they'll be added back if order is cancelled or fails)
	return nil
}

// OrderError represents an order validation error
type OrderError struct {
	Message string
}

func (e *OrderError) Error() string {
	return e.Message
}

// GetPrice returns the price for a specific symbol
func (s *Storage) GetPrice(symbol string) (*StockPrice, bool) {
	s.pricesMutex.RLock()
	defer s.pricesMutex.RUnlock()
	price, exists := s.prices[symbol]
	if exists {
		// Return a copy
		priceCopy := &StockPrice{
			Symbol:       price.Symbol,
			Price:        price.Price,
			Change:       price.Change,
			PriceHistory: price.PriceHistory,
			Logo:         price.Logo,
			Name:         price.Name,
		}
		return priceCopy, true
	}
	return nil, false
}

// GetAllPrices returns all stock prices
func (s *Storage) GetAllPrices() []StockPrice {
	s.pricesMutex.RLock()
	defer s.pricesMutex.RUnlock()
	prices := make([]StockPrice, 0, len(s.prices))
	for _, price := range s.prices {
		prices = append(prices, StockPrice{
			Symbol:       price.Symbol,
			Price:        price.Price,
			Change:       price.Change,
			PriceHistory: price.PriceHistory,
			Logo:         price.Logo,
			Name:         price.Name,
		})
	}
	return prices
}

// updateOrderStatuses checks and updates order statuses based on current price
func (s *Storage) updateOrderStatuses(symbol string, currentPrice float64) {
	s.ordersMutex.Lock()
	defer s.ordersMutex.Unlock()

	for i := range s.orders {
		order := &s.orders[i]

		// Only process limit orders that are pending
		if order.Symbol == symbol && order.Status == "pending" && order.OrderType == "limit" {
			// Buy limit order: execute if current price <= order price
			if order.Side == "buy" && currentPrice <= order.Price {
				account := s.GetAccount(order.Username)
				if account != nil {
					account.mutex.Lock()
					totalCost := float64(order.Quantity) * currentPrice
					if account.Credits >= totalCost {
						account.Credits -= totalCost
						account.Portfolio[symbol] += order.Quantity
						order.Status = "done"
					}
					account.mutex.Unlock()
				}
			}
			// Sell limit order: execute if current price >= order price
			if order.Side == "sell" && currentPrice >= order.Price {
				account := s.GetAccount(order.Username)
				if account != nil {
					account.mutex.Lock()
					if account.Portfolio[symbol] >= order.Quantity {
						totalRevenue := float64(order.Quantity) * currentPrice
						account.Credits += totalRevenue
						account.Portfolio[symbol] -= order.Quantity
						if account.Portfolio[symbol] == 0 {
							delete(account.Portfolio, symbol)
						}
						order.Status = "done"
					}
					account.mutex.Unlock()
				}
			}
		}
	}
}
