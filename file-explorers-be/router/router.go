package router

import (
	"file-explorers-be/server"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func NewRouter(srv server.Server) *chi.Mux {
	router := chi.NewRouter()

	// Middleware
	router.Use(middleware.Logger)
	router.Use(middleware.Recoverer)
	
	// CORS middleware
	router.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:8081", "http://localhost:8080", "http://localhost:8082"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Authentication routes
	router.Route("/auth", func(r chi.Router) {
		r.Post("/login", srv.Login)
		r.Post("/register", srv.Register)
		r.Post("/change-password", srv.ChangePassword)
	})

	// Level routes
	router.Route("/level", func(r chi.Router) {
		r.Get("/{levelId}", srv.GetLevelData)
		r.Post("/{levelId}", srv.StartLevel)
		r.Put("/{levelId}", srv.SolvedLevel)
		r.Get("/", srv.GetLevels)
	})

	router.Route("/", func(r chi.Router) {
		r.Get("/leaderboard", srv.GetLeaderboard)
		r.Get("/health", srv.HealthCheck)
	})
	return router
}
