package api

import (
	"encoding/json"
	"log"
	"math"
	"net/http"
	"stocks-backend/internal/auth"
	"stocks-backend/internal/storage"
	"stocks-backend/internal/websocket"
	"time"

	"strings"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	ws "github.com/gorilla/websocket"
)

var upgrader = ws.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// Allow all origins for development
		// In production, you should check the origin
		return true
	},
}

// Handlers contains all HTTP handlers
type Handlers struct {
	storage *storage.Storage
	hub     *websocket.Hub
}

// NewHandlers creates a new Handlers instance
func NewHandlers(store *storage.Storage, hub *websocket.Hub) *Handlers {
	return &Handlers{
		storage: store,
		hub:     hub,
	}
}

// LoginRequest represents the login request body
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// SignupRequest represents the signup request body
type SignupRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// LoginResponse represents the login response
type LoginResponse struct {
	Token   string  `json:"token"`
	User    string  `json:"user"`
	Credits float64 `json:"credits"`
}

// OrderRequest represents the order creation request
type OrderRequest struct {
	Symbol    string  `json:"symbol"`
	Side      string  `json:"side"`
	OrderType string  `json:"orderType"` // "market" or "limit"
	Quantity  int     `json:"quantity"`
	Price     float64 `json:"price"`
}

// Signup handles user registration
func (h *Handlers) Signup(w http.ResponseWriter, r *http.Request) {
	log.Printf("Signup request received from %s", r.RemoteAddr)

	var req SignupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request body"})
		return
	}

	if req.Username == "" || req.Password == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Username and password are required"})
		return
	}

	log.Printf("Signup: Attempting to create account for %s", req.Username)

	// Create account with password
	account := h.storage.CreateAccount(req.Username, req.Password)
	if account == nil {
		log.Printf("Signup: Account already exists for %s", req.Username)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusConflict)
		json.NewEncoder(w).Encode(map[string]string{"error": "Username already exists"})
		return
	}

	log.Printf("Signup: Account created successfully for %s", req.Username)

	// Generate JWT token
	token, err := auth.GenerateToken(req.Username)
	if err != nil {
		log.Printf("Signup: Error generating token: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Error generating token"})
		return
	}

	response := LoginResponse{
		Token:   token,
		User:    req.Username,
		Credits: account.Credits,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
	log.Printf("Signup: User %s registered successfully", req.Username)
}

// Login handles user authentication
func (h *Handlers) Login(w http.ResponseWriter, r *http.Request) {
	log.Printf("Login request received from %s", r.RemoteAddr)

	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Login: Invalid request body: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request body"})
		return
	}

	log.Printf("Login: Username=%s", req.Username)

	if req.Username == "" || req.Password == "" {
		log.Println("Login: Missing credentials")
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid credentials"})
		return
	}

	// Validate password
	if !h.storage.ValidatePassword(req.Username, req.Password) {
		log.Printf("Login: Invalid credentials for %s", req.Username)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid username or password"})
		return
	}

	log.Printf("Login: Password validated for %s", req.Username)

	// Get account (we know it exists because ValidatePassword returned true)
	account := h.storage.GetAccount(req.Username)

	log.Printf("Login: Found account for %s with %.2f credits", req.Username, account.Credits)

	// Generate JWT token
	token, err := auth.GenerateToken(req.Username)
	if err != nil {
		log.Printf("Login: Error generating token: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Error generating token"})
		return
	}

	log.Printf("Login: Token generated successfully for %s: %s...", req.Username, token[:min(20, len(token))])

	response := LoginResponse{
		Token:   token,
		User:    req.Username,
		Credits: account.Credits,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
	log.Printf("Login: Response sent for %s", req.Username)
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// GetPrices returns the current snapshot of all stock prices
func (h *Handlers) GetPrices(w http.ResponseWriter, r *http.Request) {
	prices := h.storage.GetAllPrices()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(prices)
}

// GetStockDetail returns detailed information for a specific stock
func (h *Handlers) GetStockDetail(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	symbol := vars["symbol"]

	price, exists := h.storage.GetPrice(symbol)
	if !exists {
		http.Error(w, "Stock not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(price)
}

// CreateOrder handles order creation (protected)
func (h *Handlers) CreateOrder(w http.ResponseWriter, r *http.Request) {
	// Get username from context (set by auth middleware)
	username, ok := r.Context().Value("username").(string)
	if !ok {
		log.Println("CreateOrder: Failed to get username from context")
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Ensure account exists
	if acc := h.storage.GetAccount(username); acc == nil {
		log.Printf("CreateOrder: Account not found for user=%s", username)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Account not found. Please sign up first."})
		return
	}

	var req OrderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("CreateOrder: Failed to decode request body: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request body"})
		return
	}

	// Normalize inputs (be lenient on casing/whitespace)
	req.Symbol = strings.ToUpper(strings.TrimSpace(req.Symbol))
	req.Side = strings.ToLower(strings.TrimSpace(req.Side))
	req.OrderType = strings.ToLower(strings.TrimSpace(req.OrderType))

	log.Printf("CreateOrder: User=%s, Request(normalized)=%+v", username, req)

	// Validate input
	if req.Symbol == "" {
		log.Println("CreateOrder: Symbol is required")
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Symbol is required"})
		return
	}
	if req.Side != "buy" && req.Side != "sell" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Side must be 'buy' or 'sell'"})
		return
	}
	if req.OrderType != "market" && req.OrderType != "limit" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "OrderType must be 'market' or 'limit'"})
		return
	}
	if req.Quantity <= 0 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Quantity must be greater than 0"})
		return
	}
	if req.OrderType == "limit" && req.Price <= 0 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Price must be greater than 0 for limit orders"})
		return
	}

	// For market orders, get current price
	actualPrice := req.Price
	if req.OrderType == "market" {
		stockPrice, exists := h.storage.GetPrice(req.Symbol)
		if !exists {
			http.Error(w, "Stock not found", http.StatusNotFound)
			return
		}
		// Round to 2 decimal places to avoid precision issues
		actualPrice = math.Round(stockPrice.Price*100) / 100
	}

	// Execute order with validation
	var err error
	if req.Side == "buy" {
		err = h.storage.ExecuteBuyOrder(username, req.Symbol, req.Quantity, actualPrice, req.OrderType)
	} else {
		err = h.storage.ExecuteSellOrder(username, req.Symbol, req.Quantity, actualPrice, req.OrderType)
	}

	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	// Determine order status
	orderStatus := "done" // Market orders are executed immediately
	if req.OrderType == "limit" {
		orderStatus = "pending" // Limit orders wait for price condition
	}

	// Create new order
	order := storage.Order{
		ID:        uuid.New().String(),
		Username:  username,
		Symbol:    req.Symbol,
		Side:      req.Side,
		OrderType: req.OrderType,
		Quantity:  req.Quantity,
		Price:     actualPrice,
		Status:    orderStatus,
		CreatedAt: time.Now(),
	}

	// Store the order
	h.storage.AddOrder(order)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(order)
}

// GetOrders returns all orders for the authenticated user (protected)
func (h *Handlers) GetOrders(w http.ResponseWriter, r *http.Request) {
	// Get username from context (set by auth middleware)
	username, ok := r.Context().Value("username").(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	orders := h.storage.GetOrders(username)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(orders)
}

// GetAccount returns the user's account information
func (h *Handlers) GetAccount(w http.ResponseWriter, r *http.Request) {
	// Get username from context (set by auth middleware)
	username, ok := r.Context().Value("username").(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	account := h.storage.GetAccount(username)
	if account == nil {
		http.Error(w, "Account not found", http.StatusNotFound)
		return
	}

	// Return account info
	response := map[string]interface{}{
		"username":  account.Username,
		"credits":   account.Credits,
		"portfolio": account.Portfolio,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// HandleWebSocket handles WebSocket connections
func (h *Handlers) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	client := &websocket.Client{
		Hub:  h.hub,
		Conn: conn,
		Send: make(chan []byte, 256),
	}

	client.Hub.Register <- client

	// Start reading and writing goroutines
	go client.WritePump()
	go client.ReadPump()
}
