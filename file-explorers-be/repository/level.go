package repository

import (
	"database/sql"
	"file-explorers-be/models"
	"fmt"
)

type LevelRepository interface {
	GetLevelsWithSolved(userId int) (levels []models.LevelStatus, err error)
	GetLevelData(level int) (data []byte, err error)
	MarkLevelSolved(userId, level int) (err error)
	GetLeaderboard() (leaderboard []models.LeaderboardEntry, err error)
}

type levelRepo struct {
	db *sql.DB
}

func NewLevelRepository(db *sql.DB) LevelRepository {
	return &levelRepo{
		db: db,
	}
}

func (repo *levelRepo) GetLevelsWithSolved(userId int) (levels []models.LevelStatus, err error) {
	sql := `
        SELECT l.level_Id, 
               CASE WHEN ul.level_id IS NOT NULL THEN TRUE ELSE FALSE END AS solved
        FROM levels l
        LEFT JOIN user_levels ul ON l.level_Id = ul.level_id AND ul.user_id = ?
    `
	rows, err := repo.db.Query(sql, userId)
	if err != nil {
		return
	}
	defer rows.Close()

	for rows.Next() {
		var ls models.LevelStatus
		err = rows.Scan(&ls.LevelID, &ls.Solved)
		if err != nil {
			return
		}
		levels = append(levels, ls)
	}
	return
}

func (repo *levelRepo) GetLevelData(level int) (data []byte, err error) {
	sql := "SELECT level_data FROM levels WHERE level_id=?"
	rows, err := repo.db.Query(sql, level)
	if err != nil {
		return
	}
	defer rows.Close()

	if rows.Next() {
		err = rows.Scan(&data)
	} else {
		err = fmt.Errorf("level not found")
	}
	return
}

func (repo *levelRepo) MarkLevelSolved(userId, level int) (err error) {
	sql := "INSERT INTO user_levels (user_id, level_id) VALUES (?, ?)"
	_, err = repo.db.Exec(sql, userId, level)
	return
}

func (repo *levelRepo) GetLeaderboard() (leaderboard []models.LeaderboardEntry, err error) {
	sql := `
		SELECT u.username, COUNT(ul.level_id) AS levels_solved
		FROM users u
		LEFT JOIN user_levels ul ON u.id = ul.user_id
		GROUP BY u.id
		ORDER BY levels_solved DESC
	`
	rows, err := repo.db.Query(sql)
	if err != nil {
		return
	}
	defer rows.Close()

	for rows.Next() {
		var entry models.LeaderboardEntry
		err = rows.Scan(&entry.Username, &entry.LevelsSolved)
		if err != nil {
			return
		}
		leaderboard = append(leaderboard, entry)
	}
	return
}
