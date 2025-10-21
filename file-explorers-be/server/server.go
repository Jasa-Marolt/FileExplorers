package server

import (
	"context"
	"encoding/json"
	"file-explorers-be/models"
	"file-explorers-be/service"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

type Server struct {
	authService  service.AuthService
	levelService service.LevelService
}

func NewControllers(authService service.AuthService, levelService service.LevelService) Server {
	return Server{
		authService:  authService,
		levelService: levelService,
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

func (c Server) GetLevelData(w http.ResponseWriter, r *http.Request) {
	levelId, err := strconv.Atoi(chi.URLParam(r, "levelId"))
	if err != nil {
		WriteError(w, http.StatusBadRequest, err, "Invalid levelId")
		return
	}

	data, err := c.levelService.GetLevelData(levelId)
	if err != nil {
		WriteError(w, http.StatusBadRequest, err, err.Error())
		return
	}

	WriteSuccess(w, data, "Level data retrieved successfully")
}

func (c Server) GetLevels(w http.ResponseWriter, r *http.Request) {
	ctx := context.WithValue(r.Context(), service.ContextKeyHttpRequest, r)
	data, err := c.levelService.GetLevels(ctx)
	if err != nil {
		WriteError(w, http.StatusBadRequest, err, err.Error())
		return
	}

	WriteSuccess(w, data, "Levels retrieved successfully")
}

func (c Server) SolvedLevel(w http.ResponseWriter, r *http.Request) {
	levelId, err := strconv.Atoi(chi.URLParam(r, "levelId"))
	if err != nil {
		WriteError(w, http.StatusBadRequest, err, "Invalid levelId")
		return
	}

	ctx := context.WithValue(r.Context(), service.ContextKeyHttpRequest, r)
	data, err := c.levelService.SolvedLevel(ctx, levelId)
	if err != nil {
		WriteError(w, http.StatusBadRequest, err, err.Error())
		return
	}

	WriteSuccess(w, data, "Level marked as solved successfully")
}
