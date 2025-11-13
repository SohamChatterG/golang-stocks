package main

import (
	"log"
	"net/http"
	"stocks-backend/internal/api"
	"stocks-backend/internal/auth"
	"stocks-backend/internal/simulation"
	"stocks-backend/internal/storage"
	"stocks-backend/internal/websocket"

	"github.com/gorilla/mux"
)

func main() {
	// Initialize storage
	store := storage.GetInstance()

	// Initialize WebSocket hub
	hub := websocket.NewHub()
	go hub.Run()

	// Initialize price simulator
	simulator := simulation.NewSimulator(store, hub)
	simulator.Start()
	defer simulator.Stop()

	// Initialize handlers
	handlers := api.NewHandlers(store, hub)

	// Create router
	router := mux.NewRouter()

	// Enable CORS for development (must be first)
	router.Use(corsMiddleware)

	// Public routes
	router.HandleFunc("/signup", handlers.Signup).Methods("POST", "OPTIONS")
	router.HandleFunc("/login", handlers.Login).Methods("POST", "OPTIONS")
	router.HandleFunc("/prices", handlers.GetPrices).Methods("GET", "OPTIONS")
	router.HandleFunc("/stocks/{symbol}", handlers.GetStockDetail).Methods("GET", "OPTIONS")
	router.HandleFunc("/ws", handlers.HandleWebSocket)

	// Protected routes
	protectedRouter := router.PathPrefix("/api").Subrouter()
	protectedRouter.Use(corsMiddleware) // Apply CORS to protected routes too
	protectedRouter.Use(auth.JWTMiddleware)
	protectedRouter.HandleFunc("/orders", handlers.CreateOrder).Methods("POST", "OPTIONS")
	protectedRouter.HandleFunc("/orders", handlers.GetOrders).Methods("GET", "OPTIONS")
	protectedRouter.HandleFunc("/account", handlers.GetAccount).Methods("GET", "OPTIONS")

	// Start server
	log.Println("Server starting on :8080")
	if err := http.ListenAndServe(":8080", router); err != nil {
		log.Fatal("Server error:", err)
	}
}

// corsMiddleware adds CORS headers - fully permissive for development
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Allow all origins
		w.Header().Set("Access-Control-Allow-Origin", "*")

		// Allow all common HTTP methods
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD")

		// Allow all headers that might be sent
		w.Header().Set("Access-Control-Allow-Headers", "Accept, Authorization, Content-Type, X-CSRF-Token, X-Requested-With, Origin")

		// Expose headers to the client
		w.Header().Set("Access-Control-Expose-Headers", "Content-Length, Content-Type, Authorization")

		// Allow credentials
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		// Cache preflight for 24 hours
		w.Header().Set("Access-Control-Max-Age", "86400")

		// Handle preflight OPTIONS requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
