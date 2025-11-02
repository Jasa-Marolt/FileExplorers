package models

type LevelRequest struct {
	Level int `json:"level" binding:"required"`
}

type LevelData struct {
	Data         interface{} `json:"data,omitempty"`
	Name         string      `json:"name,omitempty"`
	Description  string      `json:"description,omitempty"`
	Difficulty   int         `json:"difficulty,omitempty"`
	Instructions string      `json:"instructions,omitempty"`
}

type LevelStatus struct {
	LevelID    int    `json:"level_id"`
	Solved     bool   `json:"solved"`
	Name       string `json:"name"`
	Difficulty string `json:"description"`
}

type LeaderboardEntry struct {
	Username     string `json:"username"`
	LevelsSolved int    `json:"levels_solved"`
	TotalTime    int64  `json:"total_time"`
}
