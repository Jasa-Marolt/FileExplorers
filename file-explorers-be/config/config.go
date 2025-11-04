package config

import (
	"fmt"
	"os"
)

type Config struct {
	DBHost     string
	DBUser     string
	DBPassword string
	DBName     string
	JwtSecret  string
	JwtIssuer  string
}

func NewConfig() Config {
	return Config{
		DBHost:     getEnv("DB_HOST", "nejc:password@tcp(172.30.0.10:3306)/file_explorers"),
		DBUser:     getEnv("DB_USER", "nejc"),
		DBPassword: getEnv("DB_PASSWORD", "password"),
		DBName:     getEnv("DB_NAME", "file_explorers"),

		JwtSecret: getEnv("JWT_SECRET", "your_jwt_secret"),
		JwtIssuer: getEnv("JWT_ISSUER", "file-explorers"),
	}
}

func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}

func (cfg *Config) Print() {
	fmt.Println("Configuration:")
	fmt.Println("DB Host: ", cfg.DBHost)
	fmt.Println("DB User: ", cfg.DBUser)
	fmt.Println("DB Name: ", cfg.DBName)
	fmt.Println("JWT Secret: ", cfg.JwtSecret)
	fmt.Println("JWT Issuer: ", cfg.JwtIssuer)
	fmt.Println("-----")
}
