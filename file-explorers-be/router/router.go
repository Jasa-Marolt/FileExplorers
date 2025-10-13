package router

import (
	"file-explorers-be/server"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func NewRouter(srv server.Server) *chi.Mux {
	router := chi.NewRouter()

	// Middleware
	router.Use(middleware.Logger)
	router.Use(middleware.Recoverer)

	// Authentication routes
	router.Route("/auth", func(r chi.Router) {
		r.Post("/login", srv.Login)
		r.Post("/register", srv.Register)
		r.Post("/change-password", srv.ChangePassword)
	})

	return router
}
