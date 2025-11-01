package models

type LevelRequest struct {
	Level int `json:"level" binding:"required"`
}

type LevelResponse struct {
	Data interface{} `json:"data,omitempty"`
}

type LevelStatus struct {
	LevelID int  `json:"level_id"`
	Solved  bool `json:"solved"`
}

type LeaderboardEntry struct {
	Username     string `json:"username"`
	LevelsSolved int    `json:"levels_solved"`
	TotalTime    int64  `json:"total_time"`
}
