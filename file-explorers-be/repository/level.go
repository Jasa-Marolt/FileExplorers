package repository

import (
	"database/sql"
	"encoding/json"
	"file-explorers-be/models"
	"fmt"
	"log"
)

type LevelRepository interface {
	GetLevelsWithSolved(userId int) (levels []models.LevelStatus, err error)
	GetLevelData(level int) (data models.LevelData, err error)
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
               CASE WHEN ul.level_id IS NOT NULL THEN TRUE ELSE FALSE END AS solved, 
			   l.name, l.difficulty
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
		err = rows.Scan(
			&ls.LevelID,
			&ls.Solved,
			&ls.Name,
			&ls.Difficulty,
		)
		if err != nil {
			return
		}
		levels = append(levels, ls)
	}
	return
}

func (repo *levelRepo) GetLevelData(level int) (data models.LevelData, err error) {
	log.Println("[DEBUG levelRepo.GetLevelData] Querying database for level:", level)
	
	// NOTE: database schema defines the solution column as `level_solution`.
	// Use that column name to avoid "Unknown column 'solution'" errors.
	sql := "SELECT level_id, starting_file_system, level_solution, name, description, difficulty, instructions  FROM levels WHERE level_id=?"
	rows, err := repo.db.Query(sql, level)
	if err != nil {
		log.Println("[DEBUG levelRepo.GetLevelData] Database query error:", err)
		return
	}
	defer rows.Close()

	var startingFileSystem []byte
	var solution []byte

	if rows.Next() {
		err = rows.Scan(
			&data.LevelID,
			&startingFileSystem,
			&solution,
			&data.Name,
			&data.Description,
			&data.Difficulty,
			&data.Instructions,
		)
		log.Println("[DEBUG levelRepo.GetLevelData] Row scanned successfully, level:", data.LevelID)
	} else {
		err = fmt.Errorf("level not found")
		log.Println("[DEBUG levelRepo.GetLevelData] Level not found in database")
	}

	if err != nil {
		log.Println("[DEBUG levelRepo.GetLevelData] Error during row scan:", err)
		return
	}

	fmt.Println("[DEBUG levelRepo.GetLevelData] Unmarshaling starting_file_system JSON")
	err = json.Unmarshal(startingFileSystem, &data.StartingFileSystem)
	if err != nil {
		log.Println("[DEBUG levelRepo.GetLevelData] Error unmarshaling starting_file_system:", err)
		return
	}

	fmt.Println("[DEBUG levelRepo.GetLevelData] Unmarshaling solution JSON")
	err = json.Unmarshal(solution, &data.Solution)
	if err != nil {
		log.Println("[DEBUG levelRepo.GetLevelData] Error unmarshaling solution:", err)
	}
	log.Println("[DEBUG levelRepo.GetLevelData] Successfully retrieved level data")
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
