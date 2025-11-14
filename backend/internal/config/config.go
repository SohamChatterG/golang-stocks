package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	MongoURI     string
	DatabaseName string
	JWTSecret    string
	ServerPort   string
}

func Load() *Config {
	// Load .env file (ignore error if file doesn't exist - use defaults)
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables or defaults")
	}

	return &Config{
		MongoURI:     getEnv("MONGO_URI", "mongodb://localhost:27017"),
		DatabaseName: getEnv("DATABASE_NAME", "stocks_trading"),
		JWTSecret:    getEnv("JWT_SECRET", "your-secret-key-change-in-production"),
		ServerPort:   getEnv("PORT", "8080"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
