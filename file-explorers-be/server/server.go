package server

import (
	"context"
	"encoding/json"
	"file-explorers-be/models"
	"file-explorers-be/service"
	"fmt"
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

	jwt, user, err := c.authService.Authenticate(req.Username, req.Password)
	if err != nil {
		WriteError(w, http.StatusUnauthorized, err, err.Error())
		return
	}

	w.Header().Set("Authorization", "Bearer "+jwt)
	WriteSuccess(w, map[string]interface{}{
		"token": jwt,
		"user":  user,
	}, "Login successful")
}

func (c Server) Register(w http.ResponseWriter, r *http.Request) {
	var req models.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, err, "Invalid request")
		return
	}

	jwt, user, err := c.authService.Register(req.Username, req.Email, req.Password)
	if err != nil {
		WriteError(w, http.StatusBadRequest, err, err.Error())
		return
	}

	w.Header().Set("Authorization", "Bearer "+jwt)
	WriteCreated(w, map[string]interface{}{
		"token": jwt,
		"user":  user,
	}, "Registration successful")
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
	ctx := context.WithValue(r.Context(), service.ContextKeyHttpRequest, r)
	levelId, err := strconv.Atoi(chi.URLParam(r, "levelId"))
	if err != nil {
		fmt.Println("[DEBUG GetLevelData] Invalid levelId:", err)
		WriteError(w, http.StatusBadRequest, err, "Invalid levelId")
		return
	}
	fmt.Println("[DEBUG GetLevelData] Fetching level data for levelId:", levelId)

	data, err := c.levelService.GetLevelData(ctx, levelId)
	if err != nil {
		fmt.Println("[DEBUG GetLevelData] Error from service:", err)
		WriteError(w, http.StatusBadRequest, err, err.Error())
		return
	}

	fmt.Println("[DEBUG GetLevelData] Successfully retrieved level data")
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

func (c Server) StartLevel(w http.ResponseWriter, r *http.Request) {
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

	WriteSuccess(w, data, "Level marked as started successfully")
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

func (c Server) GetLeaderboard(w http.ResponseWriter, r *http.Request) {
	ctx := context.WithValue(r.Context(), service.ContextKeyHttpRequest, r)

	// Get timeFilter query parameter (default to "all")
	timeFilter := r.URL.Query().Get("timeFilter")
	if timeFilter == "" {
		timeFilter = "all"
	}

	data, err := c.levelService.GetLeaderboard(ctx, timeFilter)
	if err != nil {
		WriteError(w, http.StatusBadRequest, err, err.Error())
		return
	}

	WriteSuccess(w, data, "Leaderboard retrieved successfully")
}

func (c Server) HealthCheck(w http.ResponseWriter, r *http.Request) {
	WriteSuccess(w, nil, "Server is healthy")
}
