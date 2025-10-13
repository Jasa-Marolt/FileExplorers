package server

import (
	"encoding/json"
	"file-explorers-be/models"
	"file-explorers-be/service"
	"net/http"
)

type Server struct {
	authService service.AuthService
}

func NewControllers(authService service.AuthService) Server {
	return Server{
		authService: authService,
	}
}

func (c Server) Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, err, "Invalid request")
		return
	}

	jwt, err := c.authService.Authenticate(req.Username, req.Password)
	if err != nil {
		WriteError(w, http.StatusUnauthorized, err, err.Error())
		return
	}

	w.Header().Set("Authorization", "Bearer "+jwt)
	WriteSuccess(w, nil, "Login successful")
}

func (c Server) Register(w http.ResponseWriter, r *http.Request) {
	var req models.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, err, "Invalid request")
		return
	}

	jwt, err := c.authService.Register(req.Username, req.Email, req.Password)
	if err != nil {
		WriteError(w, http.StatusBadRequest, err, err.Error())
		return
	}

	w.Header().Set("Authorization", "Bearer "+jwt)
	WriteCreated(w, nil, "Registration successful")
}

func (c Server) ChangePassword(w http.ResponseWriter, r *http.Request) {
	var req models.ChangePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, err, "Invalid request")
		return
	}

	err := c.authService.PasswordChange(req.Username, req.OldPassword, req.NewPassword)
	if err != nil {
		WriteError(w, http.StatusBadRequest, err, err.Error())
		return
	}

	WriteSuccess(w, nil, "Password changed successfully")
}
