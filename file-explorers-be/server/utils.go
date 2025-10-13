package server

import (
	"encoding/json"
	"net/http"
)

type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

func WriteJSON(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data)
}

func WriteSuccess(w http.ResponseWriter, data interface{}, message ...string) {
	msg := ""
	if len(message) > 0 {
		msg = message[0]
	}

	response := Response{
		Success: true,
		Message: msg,
		Data:    data,
	}
	WriteJSON(w, http.StatusOK, response)
}

func WriteCreated(w http.ResponseWriter, data interface{}, message ...string) {
	msg := "Resource created successfully"
	if len(message) > 0 {
		msg = message[0]
	}

	response := Response{
		Success: true,
		Message: msg,
		Data:    data,
	}
	WriteJSON(w, http.StatusCreated, response)
}

func WriteError(w http.ResponseWriter, statusCode int, err error, message ...string) {
	msg := "An error occurred"
	if len(message) > 0 {
		msg = message[0]
	}

	response := Response{
		Success: false,
		Message: msg,
		Error:   err.Error(),
	}
	WriteJSON(w, statusCode, response)
}

func WriteBadRequest(w http.ResponseWriter, err error, message ...string) {
	msg := "Invalid request"
	if len(message) > 0 {
		msg = message[0]
	}
	WriteError(w, http.StatusBadRequest, err, msg)
}
