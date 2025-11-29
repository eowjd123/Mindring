'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useUser } from '@/contexts/UserContext'
import { formatTime, getDifficultyLabel } from '@/lib/puzzle-score'

interface Ranking {
  rank: number
  recordId: string
  userId: string
  userName: string
  puzzleId: string
  difficulty: number
  completionTime: number | null
  moves: number | null
  score: number
  completedAt: string | null
}

export default function PuzzleRankingsPage() {
  const { user } = useUser()
  const [rankings, setRankings] = useState<Ranking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null)
  const [selectedPuzzleId, setSelectedPuzzleId] = useState<string | null>(null)
  const [viewType, setViewType] = useState<'global' | 'personal'>('global')
  const [myRankings, setMyRankings] = useState<Ranking[]>([])

  // 난이도 옵션
  const difficulties = [
    { value: 4, label: '1단계 (2×2)' },
    { value: 9, label: '2단계 (3×3)' },
    { value: 16, label: '3단계 (4×4)' },
    { value: 36, label: '4단계 (6×6)' },
  ]

  // 랭킹 조회
  const fetchRankings = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (selectedDifficulty) {
        params.append('difficulty', selectedDifficulty.toString())
      }
      if (selectedPuzzleId) {
        params.append('puzzleId', selectedPuzzleId)
      }
      params.append('limit', '100')
      params.append('type', viewType)

      const response = await fetch(`/api/puzzles/rankings?${params.toString()}`, {
        credentials: 'include',
      })

      // 응답이 JSON인지 확인
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`랭킹 조회에 실패했습니다. (${response.status})`)
      }

      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        throw new Error(`응답을 파싱할 수 없습니다. (${response.status})`)
      }

      if (!response.ok) {
        // API가 에러 메시지를 반환한 경우
        const errorMessage = (data && typeof data === 'object' && 'error' in data) 
          ? data.error 
          : `랭킹 조회에 실패했습니다. (${response.status})`
        throw new Error(errorMessage)
      }

      if (data && data.success) {
        setRankings(data.rankings || [])
      } else {
        const errorMessage = (data && typeof data === 'object' && 'error' in data)
          ? data.error
          : '랭킹 조회에 실패했습니다.'
        throw new Error(errorMessage)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '랭킹 조회 중 오류가 발생했습니다.'
      setError(errorMessage)
      console.error('Failed to fetch rankings:', err)
      // 에러 발생 시 빈 배열로 설정
      setRankings([])
    } finally {
      setLoading(false)
    }
  }

  // 개인 기록 조회
  const fetchMyRecords = async () => {
    if (!user) {
      setMyRankings([])
      return
    }

    try {
      const response = await fetch('/api/puzzles/records', {
        credentials: 'include',
      })

      // 응답이 JSON인지 확인
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        setMyRankings([])
        return
      }

      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        console.warn('Failed to parse response:', jsonError)
        setMyRankings([])
        return
      }

      if (response.ok && data && data.success) {
        setMyRankings(data.records || [])
      } else {
        // 에러가 있어도 조용히 처리 (개인 기록은 선택사항)
        setMyRankings([])
        if (data && typeof data === 'object' && 'error' in data && response.status !== 401) {
          console.warn('Failed to fetch my records:', data.error)
        }
      }
    } catch (err) {
      console.error('Failed to fetch my records:', err)
      setMyRankings([])
    }
  }

  useEffect(() => {
    fetchRankings()
    if (user) {
      fetchMyRecords()
    }
  }, [selectedDifficulty, selectedPuzzleId, viewType, user])

  // 랭킹 색상 (1, 2, 3위는 특별한 색상)
  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-500 bg-yellow-50 border-yellow-200'
    if (rank === 2) return 'text-gray-400 bg-gray-50 border-gray-200'
    if (rank === 3) return 'text-orange-500 bg-orange-50 border-orange-200'
    return 'text-gray-600 bg-white border-gray-200'
  }

  // 랭킹 아이콘
  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/puzzle-home"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
              >
                <span>←</span>
                <span>퍼즐 홈</span>
              </Link>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                🏆 퍼즐 랭킹
              </h1>
            </div>
            {user && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100">
                <span className="text-sm font-medium text-gray-700">
                  👤 {user.name || user.email || '사용자'}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* 필터 섹션 */}
        <div className="mb-8 bg-white rounded-2xl shadow-lg p-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* 뷰 타입 선택 */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">보기:</span>
              <button
                onClick={() => setViewType('global')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  viewType === 'global'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                전체 랭킹
              </button>
              {user && (
                <button
                  onClick={() => setViewType('personal')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    viewType === 'personal'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  내 기록
                </button>
              )}
            </div>

            {/* 난이도 필터 */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">난이도:</span>
              <select
                value={selectedDifficulty || ''}
                onChange={(e) => setSelectedDifficulty(e.target.value ? parseInt(e.target.value) : null)}
                className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">전체</option>
                {difficulties.map((diff) => (
                  <option key={diff.value} value={diff.value}>
                    {diff.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 새로고침 버튼 */}
            <button
              onClick={fetchRankings}
              className="ml-auto px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
            >
              🔄 새로고침
            </button>
          </div>
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">랭킹을 불러오는 중...</p>
          </div>
        )}

        {/* 에러 상태 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* 랭킹 테이블 */}
        {!loading && !error && (
          <>
            {rankings.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">기록이 없습니다</h3>
                <p className="text-gray-600 mb-6">
                  {viewType === 'personal' ? '아직 완료한 퍼즐이 없습니다.' : '아직 등록된 기록이 없습니다.'}
                </p>
                <Link
                  href="/puzzle-home"
                  className="inline-block px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md"
                >
                  퍼즐 시작하기
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      <tr>
                        <th className="px-6 py-4 text-left font-semibold">순위</th>
                        <th className="px-6 py-4 text-left font-semibold">사용자</th>
                        <th className="px-6 py-4 text-left font-semibold">난이도</th>
                        <th className="px-6 py-4 text-center font-semibold">점수</th>
                        <th className="px-6 py-4 text-center font-semibold">시간</th>
                        <th className="px-6 py-4 text-center font-semibold">이동</th>
                        <th className="px-6 py-4 text-center font-semibold">완료일</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {rankings.map((ranking, index) => {
                        const isMyRecord = user && ranking.userId === user.userId
                        return (
                          <tr
                            key={ranking.recordId}
                            className={`hover:bg-gray-50 transition-colors ${
                              isMyRecord ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                            }`}
                          >
                            <td className="px-6 py-4">
                              <div
                                className={`inline-flex items-center justify-center w-10 h-10 rounded-full border-2 font-bold ${getRankColor(
                                  ranking.rank
                                )}`}
                              >
                                {getRankIcon(ranking.rank) || ranking.rank}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">{ranking.userName}</span>
                                {isMyRecord && (
                                  <span className="px-2 py-1 text-xs font-semibold bg-blue-600 text-white rounded-full">
                                    나
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-medium text-sm">
                                {getDifficultyLabel(ranking.difficulty)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="font-bold text-lg text-blue-600">
                                {ranking.score.toLocaleString()}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {ranking.completionTime !== null ? (
                                <span className="text-gray-700 font-medium">
                                  {formatTime(ranking.completionTime)}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {ranking.moves !== null ? (
                                <span className="text-gray-700 font-medium">{ranking.moves}회</span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {ranking.completedAt ? (
                                <span className="text-sm text-gray-600">
                                  {new Date(ranking.completedAt).toLocaleDateString('ko-KR', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* 개인 기록 요약 (전체 랭킹 보기일 때) */}
        {!loading && !error && viewType === 'global' && user && myRankings.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📊 내 기록 요약</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-md">
                <div className="text-sm text-gray-600 mb-1">최고 점수</div>
                <div className="text-2xl font-bold text-blue-600">
                  {Math.max(...myRankings.map((r) => r.score)).toLocaleString()}점
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-md">
                <div className="text-sm text-gray-600 mb-1">완료한 퍼즐</div>
                <div className="text-2xl font-bold text-purple-600">{myRankings.length}개</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-md">
                <div className="text-sm text-gray-600 mb-1">평균 점수</div>
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(
                    myRankings.reduce((sum, r) => sum + r.score, 0) / myRankings.length
                  ).toLocaleString()}
                  점
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

