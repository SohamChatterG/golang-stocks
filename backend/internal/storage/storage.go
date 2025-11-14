package storage

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"sync"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// Order represents a trading order
type Order struct {
	ID        string    `json:"id" bson:"_id,omitempty"`
	Username  string    `json:"username" bson:"username"`
	Symbol    string    `json:"symbol" bson:"symbol"`
	Side      string    `json:"side" bson:"side"`           // "buy" or "sell"
	OrderType string    `json:"orderType" bson:"orderType"` // "market" or "limit"
	Quantity  int       `json:"quantity" bson:"quantity"`
	Price     float64   `json:"price" bson:"price"`
	Status    string    `json:"status" bson:"status"`
	CreatedAt time.Time `json:"createdAt" bson:"createdAt"`
}

// StockPrice represents the current price of a stock
type StockPrice struct {
	Symbol       string    `json:"symbol" bson:"_id"`
	Price        float64   `json:"price" bson:"price"`
	Change       float64   `json:"change" bson:"change"` // percentage change
	PriceHistory []float64 `json:"priceHistory" bson:"priceHistory"`
	Logo         string    `json:"logo" bson:"logo"`
	Name         string    `json:"name" bson:"name"`
	DayHigh      float64   `json:"dayHigh" bson:"dayHigh"`
	DayLow       float64   `json:"dayLow" bson:"dayLow"`
	DayOpen      float64   `json:"dayOpen" bson:"dayOpen"`
	Volume       int64     `json:"volume" bson:"volume"`
}

// UserAccount represents a user's trading account
type UserAccount struct {
	Username     string         `json:"username" bson:"_id"`
	PasswordHash string         `json:"-" bson:"passwordHash"` // Don't expose in JSON
	Credits      float64        `json:"credits" bson:"credits"`
	Portfolio    map[string]int `json:"portfolio" bson:"portfolio"` // symbol -> quantity
}

// Storage provides MongoDB-backed storage
type Storage struct {
	db             *mongo.Database
	usersCol       *mongo.Collection
	ordersCol      *mongo.Collection
	pricesCol      *mongo.Collection
	accountMutexes map[string]*sync.RWMutex
	mutexLock      sync.RWMutex
}

// NewStorage creates a new MongoDB storage instance
func NewStorage(client *mongo.Client, dbName string) (*Storage, error) {
	db := client.Database(dbName)

	storage := &Storage{
		db:             db,
		usersCol:       db.Collection("users"),
		ordersCol:      db.Collection("orders"),
		pricesCol:      db.Collection("prices"),
		accountMutexes: make(map[string]*sync.RWMutex),
	}

	// Create indexes
	ctx := context.Background()
	if err := storage.createIndexes(ctx); err != nil {
		return nil, fmt.Errorf("failed to create indexes: %w", err)
	}

	// Initialize default stock prices if not exist
	if err := storage.initializeStocks(ctx); err != nil {
		return nil, fmt.Errorf("failed to initialize stocks: %w", err)
	}

	return storage, nil
}

// createIndexes creates database indexes for performance
func (s *Storage) createIndexes(ctx context.Context) error {
	// Index on orders collection
	_, err := s.ordersCol.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{Keys: bson.D{{Key: "username", Value: 1}}},
		{Keys: bson.D{{Key: "symbol", Value: 1}}},
		{Keys: bson.D{{Key: "status", Value: 1}}},
	})
	if err != nil {
		return err
	}

	return nil
}

// initializeStocks creates default stocks if they don't exist
func (s *Storage) initializeStocks(ctx context.Context) error {
	stocks := []StockPrice{
		{
			Symbol:       "AAPL",
			Price:        150.00,
			Change:       0.0,
			PriceHistory: []float64{150.00},
			Logo:         "https://logo.clearbit.com/apple.com",
			Name:         "Apple Inc.",
			DayHigh:      151.50,
			DayLow:       148.20,
			DayOpen:      149.00,
			Volume:       45000000,
		},
		{
			Symbol:       "TSLA",
			Price:        250.00,
			Change:       0.0,
			PriceHistory: []float64{250.00},
			Logo:         "https://logo.clearbit.com/tesla.com",
			Name:         "Tesla, Inc.",
			DayHigh:      255.80,
			DayLow:       247.10,
			DayOpen:      248.50,
			Volume:       82000000,
		},
		{
			Symbol:       "AMZN",
			Price:        135.00,
			Change:       0.0,
			PriceHistory: []float64{135.00},
			Logo:         "https://logo.clearbit.com/amazon.com",
			Name:         "Amazon.com, Inc.",
			DayHigh:      137.20,
			DayLow:       133.80,
			DayOpen:      134.50,
			Volume:       52000000,
		},
		{
			Symbol:       "GOOGL",
			Price:        140.00,
			Change:       0.0,
			PriceHistory: []float64{140.00},
			Logo:         "https://logo.clearbit.com/google.com",
			Name:         "Alphabet Inc.",
			DayHigh:      142.50,
			DayLow:       138.90,
			DayOpen:      139.50,
			Volume:       28000000,
		},
		{
			Symbol:       "MSFT",
			Price:        380.00,
			Change:       0.0,
			PriceHistory: []float64{380.00},
			Logo:         "https://logo.clearbit.com/microsoft.com",
			Name:         "Microsoft Corporation",
			DayHigh:      385.60,
			DayLow:       377.30,
			DayOpen:      379.00,
			Volume:       35000000,
		},
		{
			Symbol:       "NVDA",
			Price:        495.00,
			Change:       0.0,
			PriceHistory: []float64{495.00},
			Logo:         "https://logo.clearbit.com/nvidia.com",
			Name:         "NVIDIA Corporation",
			DayHigh:      502.80,
			DayLow:       490.20,
			DayOpen:      492.00,
			Volume:       68000000,
		},
		{
			Symbol:       "META",
			Price:        330.00,
			Change:       0.0,
			PriceHistory: []float64{330.00},
			Logo:         "https://logo.clearbit.com/meta.com",
			Name:         "Meta Platforms, Inc.",
			DayHigh:      335.90,
			DayLow:       327.40,
			DayOpen:      328.50,
			Volume:       42000000,
		},
		{
			Symbol:       "NFLX",
			Price:        445.00,
			Change:       0.0,
			PriceHistory: []float64{445.00},
			Logo:         "https://logo.clearbit.com/netflix.com",
			Name:         "Netflix, Inc.",
			DayHigh:      450.30,
			DayLow:       441.80,
			DayOpen:      443.00,
			Volume:       25000000,
		},
		{
			Symbol:       "AMD",
			Price:        120.00,
			Change:       0.0,
			PriceHistory: []float64{120.00},
			Logo:         "https://logo.clearbit.com/amd.com",
			Name:         "Advanced Micro Devices",
			DayHigh:      122.80,
			DayLow:       118.40,
			DayOpen:      119.20,
			Volume:       58000000,
		},
		{
			Symbol:       "DIS",
			Price:        95.00,
			Change:       0.0,
			PriceHistory: []float64{95.00},
			Logo:         "https://logo.clearbit.com/disney.com",
			Name:         "The Walt Disney Company",
			DayHigh:      96.50,
			DayLow:       93.80,
			DayOpen:      94.20,
			Volume:       32000000,
		},
		{
			Symbol:       "INTC",
			Price:        45.00,
			Change:       0.0,
			PriceHistory: []float64{45.00},
			Logo:         "https://logo.clearbit.com/intel.com",
			Name:         "Intel Corporation",
			DayHigh:      45.90,
			DayLow:       44.20,
			DayOpen:      44.80,
			Volume:       48000000,
		},
		{
			Symbol:       "BABA",
			Price:        85.00,
			Change:       0.0,
			PriceHistory: []float64{85.00},
			Logo:         "https://logo.clearbit.com/alibaba.com",
			Name:         "Alibaba Group",
			DayHigh:      86.80,
			DayLow:       83.90,
			DayOpen:      84.50,
			Volume:       38000000,
		},
	}

	for _, stock := range stocks {
		filter := bson.M{"_id": stock.Symbol}
		update := bson.M{"$setOnInsert": stock}
		opts := options.Update().SetUpsert(true)
		_, err := s.pricesCol.UpdateOne(ctx, filter, update, opts)
		if err != nil {
			return err
		}
	}

	return nil
}

// getAccountMutex returns a mutex for a specific account (thread-safe)
func (s *Storage) getAccountMutex(username string) *sync.RWMutex {
	s.mutexLock.Lock()
	defer s.mutexLock.Unlock()

	if _, exists := s.accountMutexes[username]; !exists {
		s.accountMutexes[username] = &sync.RWMutex{}
	}
	return s.accountMutexes[username]
}

// hashPassword creates a SHA-256 hash of the password
func hashPassword(password string) string {
	hash := sha256.Sum256([]byte(password))
	return hex.EncodeToString(hash[:])
}

// CreateAccount creates a new user account with initial credits
func (s *Storage) CreateAccount(username, password string) *UserAccount {
	ctx := context.Background()

	// Check if account already exists
	var existing UserAccount
	err := s.usersCol.FindOne(ctx, bson.M{"_id": username}).Decode(&existing)
	if err == nil {
		return nil // Account already exists
	}

	account := &UserAccount{
		Username:     username,
		PasswordHash: hashPassword(password),
		Credits:      2000.0,
		Portfolio:    make(map[string]int),
	}

	_, err = s.usersCol.InsertOne(ctx, account)
	if err != nil {
		return nil
	}

	return account
}

// ValidatePassword checks if the provided password matches the stored hash
func (s *Storage) ValidatePassword(username, password string) bool {
	ctx := context.Background()

	var account UserAccount
	err := s.usersCol.FindOne(ctx, bson.M{"_id": username}).Decode(&account)
	if err != nil {
		return false
	}

	return account.PasswordHash == hashPassword(password)
}

// GetAccount returns a user's account
func (s *Storage) GetAccount(username string) *UserAccount {
	ctx := context.Background()

	var account UserAccount
	err := s.usersCol.FindOne(ctx, bson.M{"_id": username}).Decode(&account)
	if err != nil {
		return nil
	}

	return &account
}

// AddOrder adds a new order to storage
func (s *Storage) AddOrder(order Order) {
	ctx := context.Background()

	// Generate ID if not present
	if order.ID == "" {
		order.ID = primitive.NewObjectID().Hex()
	}

	s.ordersCol.InsertOne(ctx, order)
}

// GetOrders returns all orders for a user
func (s *Storage) GetOrders(username string) []Order {
	ctx := context.Background()

	filter := bson.M{"username": username}
	cursor, err := s.ordersCol.Find(ctx, filter)
	if err != nil {
		return []Order{}
	}
	defer cursor.Close(ctx)

	var orders []Order
	if err := cursor.All(ctx, &orders); err != nil {
		return []Order{}
	}

	return orders
}

// UpdatePrice updates a stock price
func (s *Storage) UpdatePrice(symbol string, newPrice, change float64) {
	ctx := context.Background()

	// First, get current stock to check day high/low
	var currentStock StockPrice
	err := s.pricesCol.FindOne(ctx, bson.M{"_id": symbol}).Decode(&currentStock)
	if err != nil {
		return
	}

	// Update day high/low
	dayHigh := currentStock.DayHigh
	dayLow := currentStock.DayLow
	if newPrice > dayHigh {
		dayHigh = newPrice
	}
	if newPrice < dayLow || dayLow == 0 {
		dayLow = newPrice
	}

	// Update price and add to history (keep last 20)
	update := bson.M{
		"$set": bson.M{
			"price":   newPrice,
			"change":  change,
			"dayHigh": dayHigh,
			"dayLow":  dayLow,
		},
		"$push": bson.M{
			"priceHistory": bson.M{
				"$each":  []float64{newPrice},
				"$slice": -20, // Keep only last 20 items
			},
		},
	}

	s.pricesCol.UpdateOne(ctx, bson.M{"_id": symbol}, update)

	// Check and update order statuses
	s.updateOrderStatuses(symbol, newPrice)
}

// ExecuteBuyOrder executes a buy order with proper validation
func (s *Storage) ExecuteBuyOrder(username, symbol string, quantity int, price float64, orderType string) error {
	ctx := context.Background()

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

	// Use account-specific mutex for thread safety
	mutex := s.getAccountMutex(username)
	mutex.Lock()
	defer mutex.Unlock()

	// Re-fetch account to get latest data
	account = s.GetAccount(username)
	if account == nil {
		return &OrderError{"Account not found"}
	}

	if account.Credits < totalCost {
		return &OrderError{"Insufficient credits"}
	}

	// For market orders, execute immediately
	if orderType == "market" {
		account.Credits -= totalCost
		if account.Portfolio == nil {
			account.Portfolio = make(map[string]int)
		}
		account.Portfolio[symbol] += quantity

		// Update in database
		update := bson.M{
			"$set": bson.M{
				"credits":   account.Credits,
				"portfolio": account.Portfolio,
			},
		}
		s.usersCol.UpdateOne(ctx, bson.M{"_id": username}, update)
		return nil
	}

	// For limit orders, just validate credits (execution happens when price condition is met)
	return nil
}

// ExecuteSellOrder executes a sell order with proper validation
func (s *Storage) ExecuteSellOrder(username, symbol string, quantity int, price float64, orderType string) error {
	ctx := context.Background()

	account := s.GetAccount(username)
	if account == nil {
		return &OrderError{"Account not found"}
	}

	// Use account-specific mutex for thread safety
	mutex := s.getAccountMutex(username)
	mutex.Lock()
	defer mutex.Unlock()

	// Re-fetch account to get latest data
	account = s.GetAccount(username)
	if account == nil {
		return &OrderError{"Account not found"}
	}

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

		// Update in database
		update := bson.M{
			"$set": bson.M{
				"credits":   account.Credits,
				"portfolio": account.Portfolio,
			},
		}
		s.usersCol.UpdateOne(ctx, bson.M{"_id": username}, update)
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
	ctx := context.Background()

	var price StockPrice
	err := s.pricesCol.FindOne(ctx, bson.M{"_id": symbol}).Decode(&price)
	if err != nil {
		return nil, false
	}

	return &price, true
}

// GetAllPrices returns all stock prices
func (s *Storage) GetAllPrices() []StockPrice {
	ctx := context.Background()

	cursor, err := s.pricesCol.Find(ctx, bson.M{})
	if err != nil {
		return []StockPrice{}
	}
	defer cursor.Close(ctx)

	var prices []StockPrice
	if err := cursor.All(ctx, &prices); err != nil {
		return []StockPrice{}
	}

	return prices
}

// updateOrderStatuses checks and updates order statuses based on current price
func (s *Storage) updateOrderStatuses(symbol string, currentPrice float64) {
	ctx := context.Background()

	// Find all pending limit orders for this symbol
	filter := bson.M{
		"symbol":    symbol,
		"status":    "pending",
		"orderType": "limit",
	}

	cursor, err := s.ordersCol.Find(ctx, filter)
	if err != nil {
		return
	}
	defer cursor.Close(ctx)

	var orders []Order
	if err := cursor.All(ctx, &orders); err != nil {
		return
	}

	for _, order := range orders {
		shouldExecute := false

		// Buy limit order: execute if current price <= order price
		if order.Side == "buy" && currentPrice <= order.Price {
			shouldExecute = true
		}
		// Sell limit order: execute if current price >= order price
		if order.Side == "sell" && currentPrice >= order.Price {
			shouldExecute = true
		}

		if shouldExecute {
			account := s.GetAccount(order.Username)
			if account == nil {
				continue
			}

			// Use account-specific mutex
			mutex := s.getAccountMutex(order.Username)
			mutex.Lock()

			// Re-fetch account to get latest data
			account = s.GetAccount(order.Username)
			if account == nil {
				mutex.Unlock()
				continue
			}

			executed := false

			if order.Side == "buy" {
				totalCost := float64(order.Quantity) * currentPrice
				if account.Credits >= totalCost {
					account.Credits -= totalCost
					if account.Portfolio == nil {
						account.Portfolio = make(map[string]int)
					}
					account.Portfolio[symbol] += order.Quantity
					executed = true
				}
			} else if order.Side == "sell" {
				if account.Portfolio[symbol] >= order.Quantity {
					totalRevenue := float64(order.Quantity) * currentPrice
					account.Credits += totalRevenue
					account.Portfolio[symbol] -= order.Quantity
					if account.Portfolio[symbol] == 0 {
						delete(account.Portfolio, symbol)
					}
					executed = true
				}
			}

			if executed {
				// Update account in database
				update := bson.M{
					"$set": bson.M{
						"credits":   account.Credits,
						"portfolio": account.Portfolio,
					},
				}
				s.usersCol.UpdateOne(ctx, bson.M{"_id": order.Username}, update)

				// Update order status
				s.ordersCol.UpdateOne(
					ctx,
					bson.M{"_id": order.ID},
					bson.M{"$set": bson.M{"status": "done"}},
				)
			}

			mutex.Unlock()
		}
	}
}
