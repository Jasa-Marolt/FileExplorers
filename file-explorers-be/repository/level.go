package repository

import (
	"database/sql"
	"file-explorers-be/models"
	"fmt"
)

type LevelRepository interface {
	GetLevelsWithSolved(userId int) (levels []models.LevelStatus, err error)
	GetLevelData(level int) (data []byte, err error)
	StartedLevel(userId, level int) (err error)
	MarkLevelSolved(userId, level int) (err error)
	GetLeaderboard(timeFilter string) (leaderboard []models.LeaderboardEntry, err error)
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

func (repo *levelRepo) StartedLevel(userId, level int) (err error) {
	sql := "INSERT INTO user_levels (user_id, level_id) VALUES (?, ?)"
	_, err = repo.db.Exec(sql, userId, level)
	return
}

func (repo *levelRepo) MarkLevelSolved(userId, level int) (err error) {
	sql := "UPDATE user_levels SET solved_at = NOW() WHERE user_id = ? AND level_id = ?"
	_, err = repo.db.Exec(sql, userId, level)
	return
}

func (repo *levelRepo) GetLeaderboard(timeFilter string) (leaderboard []models.LeaderboardEntry, err error) {
	// Build the time filter condition based on timeFilter
	timeCondition := "1=1"
	switch timeFilter {
	case "week":
		timeCondition = "ul.solved_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"
	case "month":
		timeCondition = "ul.solved_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
	case "all":
		fallthrough
	default:
		timeCondition = "1=1" // No filter for all time
	}

	sql := fmt.Sprintf(`
        SELECT 
            u.username, 
            COUNT(CASE WHEN ul.solved_at IS NOT NULL AND (%s) THEN 1 END) AS levels_solved,
            COALESCE(SUM(
                CASE 
                    WHEN ul.solved_at IS NOT NULL AND ul.started_at IS NOT NULL AND (%s)
                    THEN TIMESTAMPDIFF(SECOND, ul.started_at, ul.solved_at)
                    ELSE 0
                END
            ), 0) AS total_time
        FROM users u
        LEFT JOIN user_levels ul ON u.id = ul.user_id
        GROUP BY u.id, u.username
        HAVING levels_solved >= 0
        ORDER BY levels_solved DESC, total_time ASC
    `, timeCondition, timeCondition)
	
	rows, err := repo.db.Query(sql)
	if err != nil {
		return
	}
	defer rows.Close()

	for rows.Next() {
		var entry models.LeaderboardEntry
		err = rows.Scan(&entry.Username, &entry.LevelsSolved, &entry.TotalTime)
		if err != nil {
			return
		}
		leaderboard = append(leaderboard, entry)
	}
	return
}
