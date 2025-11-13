package simulation

import (
	"log"
	"math/rand"
	"stocks-backend/internal/storage"
	"stocks-backend/internal/websocket"
	"time"
)

// Simulator handles the price simulation logic
type Simulator struct {
	storage *storage.Storage
	hub     *websocket.Hub
	ticker  *time.Ticker
}

// NewSimulator creates a new Simulator instance
func NewSimulator(store *storage.Storage, hub *websocket.Hub) *Simulator {
	return &Simulator{
		storage: store,
		hub:     hub,
		ticker:  time.NewTicker(3 * time.Second), // Update every 3 seconds
	}
}

// Start begins the price simulation
func (s *Simulator) Start() {
	go func() {
		log.Println("Price simulation started")
		for range s.ticker.C {
			s.updatePrices()
		}
	}()
}

// Stop stops the price simulation
func (s *Simulator) Stop() {
	s.ticker.Stop()
	log.Println("Price simulation stopped")
}

// updatePrices randomly updates all stock prices
func (s *Simulator) updatePrices() {
	prices := s.storage.GetAllPrices()
	updatedPrices := make([]storage.StockPrice, 0, len(prices))

	for _, price := range prices {
		// Generate a random percentage change between -2% and +2%
		changePercent := (rand.Float64() - 0.5) * 4.0 // Range: -2.0 to +2.0
		changeAmount := price.Price * (changePercent / 100.0)
		newPrice := price.Price + changeAmount

		// Ensure price doesn't go below $1
		if newPrice < 1.0 {
			newPrice = 1.0
			changePercent = ((newPrice - price.Price) / price.Price) * 100.0
		}

		// Update storage
		s.storage.UpdatePrice(price.Symbol, newPrice, changePercent)

		// Add to updated prices list
		updatedPrices = append(updatedPrices, storage.StockPrice{
			Symbol: price.Symbol,
			Price:  newPrice,
			Change: changePercent,
		})
	}

	// Broadcast updated prices to all WebSocket clients
	if err := s.hub.Broadcast(map[string]interface{}{
		"type":   "priceUpdate",
		"prices": updatedPrices,
	}); err != nil {
		log.Printf("Error broadcasting prices: %v", err)
	}
}
