package models

type LevelRequest struct {
	Level int `json:"level" binding:"required"`
}

type LevelResponse struct {
	Data  interface{} `json:"data,omitempty"`
}

type LevelStatus struct {
    LevelID   int  `json:"level_id"`
    Solved    bool `json:"solved"`
}