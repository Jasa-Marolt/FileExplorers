package service

import (
	"context"
	"file-explorers-be/models"
	"file-explorers-be/repository"
)

type LevelService interface {
	GetLevels(ctx context.Context) (levels []models.LevelStatus, err error)
	GetLevelData(ctx context.Context, level int) (data models.LevelData, err error)
	SolvedLevel(ctx context.Context, level int) (levels []models.LevelStatus, err error)
	GetLeaderboard(ctx context.Context, timeFilter string) (leaderboard []models.LeaderboardEntry, err error)
}

type levelService struct {
	repo       repository.LevelRepository
	jwtService JwtService
}

func NewLevelService(repo repository.LevelRepository, jwtService JwtService) LevelService {
	return &levelService{
		repo:       repo,
		jwtService: jwtService,
	}
}

func (s *levelService) GetLevels(ctx context.Context) (levels []models.LevelStatus, err error) {
	jwt, err := s.jwtService.DecodeTokenFromCtx(ctx)
	if err != nil {
		return
	}
	return s.repo.GetLevelsWithSolved(jwt.UserID)
}

func (s *levelService) GetLevelData(ctx context.Context, level int) (data models.LevelData, err error) {
	_, err = s.jwtService.DecodeTokenFromCtx(ctx)
	if err != nil {
		return
	}
	return s.repo.GetLevelData(level)

}

func (s *levelService) StartedLevel(ctx context.Context, level int) (levels []models.LevelStatus, err error) {
	jwt, err := s.jwtService.DecodeTokenFromCtx(ctx)
	if err != nil {
		return
	}

	err = s.repo.MarkLevelSolved(jwt.UserID, level)
	if err != nil {
		return
	}
	return s.GetLevels(ctx)
}

func (s *levelService) SolvedLevel(ctx context.Context, level int) (levels []models.LevelStatus, err error) {
	jwt, err := s.jwtService.DecodeTokenFromCtx(ctx)
	if err != nil {
		return
	}

	err = s.repo.MarkLevelSolved(jwt.UserID, level)
	if err != nil {
		return
	}
	return s.GetLevels(ctx)
}

func (s *levelService) GetLeaderboard(ctx context.Context, timeFilter string) (leaderboard []models.LeaderboardEntry, err error) {
	return s.repo.GetLeaderboard(timeFilter)
}
