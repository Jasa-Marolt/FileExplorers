package main

import (
	"database/sql"
	"file-explorers-be/config"
	"file-explorers-be/repository"
	"file-explorers-be/router"
	"file-explorers-be/server"
	"file-explorers-be/service"
	"log"
	"net/http"

	_ "github.com/go-sql-driver/mysql"
)

func main() {
	cfg := config.NewConfig()
	cfg.Print()

	db, err := sql.Open("mysql", cfg.DBHost)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatal("Failed to ping database:", err)
	}

	authRepo := repository.NewAuthRepository(db)
	levelRepo := repository.NewLevelRepository(db)

	jwtService := service.NewJwtService(cfg)
	levelRepoService := service.NewLevelService(levelRepo, jwtService)
	authService := service.NewAuthService(authRepo, jwtService)

	srv := server.NewControllers(authService, levelRepoService)

	r := router.NewRouter(srv)

	log.Println("Starting server on :8080")
	if err := http.ListenAndServe(":8080", r); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}
