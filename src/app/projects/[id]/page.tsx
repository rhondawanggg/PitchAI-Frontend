// File: frontend/src/app/projects/[id]/page.tsx (Enhanced with editing capabilities)

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { projectApi, scoreApi, reportApi, businessPlanApi, missingInfoApi } from "@/lib/api";
import Layout from '@/components/Layout';
import type { Score, MissingInfo, ScoreHistoryItem, MissingInfoCreateData, MissingInfoUpdateData} from "@/lib/types";
import { getStatusTag, getMissingInfoStatusDisplay, getMissingInfoStatusColor, getTeamMembersDisplay, validateTeamMembers } from "@/lib/types";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  // Main states
  const [project, setProject] = useState<any>(null);
  const [scores, setScores] = useState<Score[]>([]);
  const [missingInfo, setMissingInfo] = useState<MissingInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Score editing states
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const originalScoresRef = useRef<Score[]>([]);

  // NEW: Team members editing states
  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [teamMembers, setTeamMembers] = useState("");
  const [originalTeamMembers, setOriginalTeamMembers] = useState("");
  const [teamSaving, setTeamSaving] = useState(false);
  const [teamError, setTeamError] = useState("");

  // NEW: Missing info editing states
  const [isAddingMissingInfo, setIsAddingMissingInfo] = useState(false);
  const [newMissingInfo, setNewMissingInfo] = useState<MissingInfo>({
    dimension: "",
    information_type: "",
    description: "",
    status: "pending"
  });
  const [missingInfoSaving, setMissingInfoSaving] = useState(false);

  // Other existing states...
  const [processingStatus, setProcessingStatus] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState<ScoreHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [bpInfo, setBpInfo] = useState<any>(null);
  const [downloadingBP, setDownloadingBP] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Existing score editing handlers... (keeping them the same)
  const handleScoreChange = useCallback((dimension: string, field: 'score' | 'comments', value: string | number) => {
    setScores(currentScores => {
      return currentScores.map(score => {
        if (score.dimension !== dimension) return score;
        if (field === 'score') {
          const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
          const validatedScore = Math.max(0, Math.min(numValue, score.max_score));
          return { ...score, score: validatedScore };
        } else {
          return { ...score, comments: typeof value === 'string' ? value : String(value) };
        }
      });
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    setError("");
    try {
      console.log("💾 Saving scores:", scores);
      const response = await scoreApi.updateScores(projectId, { dimensions: scores });
      console.log("✅ Save successful, response:", response);
      originalScoresRef.current = [...scores];
      setIsEditing(false);
      console.log("✅ Editing mode disabled, save complete");
    } catch (err: any) {
      console.error("❌ Save failed:", err);
      setError(err.response?.data?.message || "保存评分失败");
    } finally {
      setIsSaving(false);
    }
  }, [projectId, scores, isSaving]);

  const handleCancel = useCallback(() => {
    console.log("🔄 Canceling edit, restoring original scores");
    setScores([...originalScoresRef.current]);
    setIsEditing(false);
    setError("");
  }, []);

  const handleStartEdit = useCallback(() => {
    console.log("✏️ Starting edit mode, backing up current scores");
    originalScoresRef.current = [...scores];
    setIsEditing(true);
    setError("");
  }, [scores]);

  const handleScoreInputChange = useCallback((dimension: string, inputValue: string) => {
    if (inputValue === '') {
      handleScoreChange(dimension, 'score', 0);
      return;
    }
    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue)) {
      handleScoreChange(dimension, 'score', numValue);
    }
  }, [handleScoreChange]);

  // NEW: Team members editing handlers
  const handleStartEditTeam = useCallback(() => {
    setOriginalTeamMembers(teamMembers);
    setIsEditingTeam(true);
    setTeamError("");
  }, [teamMembers]);

  const handleSaveTeam = useCallback(async () => {
    if (teamSaving) return;

    // Validate team members
    const validationError = validateTeamMembers(teamMembers);
    if (validationError) {
      setTeamError(validationError);
      return;
    }

    setTeamSaving(true);
    setTeamError("");

    try {
      // FIXED: Send as JSON object, not plain text
      await projectApi.updateTeamMembers(projectId, teamMembers);
      setProject((prev: any) => ({ ...prev, team_members: teamMembers }));
      setIsEditingTeam(false);
      console.log("✅ Team members updated successfully");
    } catch (err: any) {
      console.error("❌ Team members save failed:", err);
      setTeamError(err.response?.data?.message || "保存团队成员失败");
    } finally {
      setTeamSaving(false);
    }
  }, [projectId, teamMembers, teamSaving]);

  const handleCancelTeam = useCallback(() => {
    setTeamMembers(originalTeamMembers);
    setIsEditingTeam(false);
    setTeamError("");
  }, [originalTeamMembers]);

  // NEW: Missing info editing handlers
  const handleAddMissingInfo = useCallback(async () => {
    if (!newMissingInfo.dimension || !newMissingInfo.description) {
      setError("请填写缺失信息的维度和描述");
      return;
    }

    // FIXED: Prevent duplicate submissions
    if (missingInfoSaving) return;

    setMissingInfoSaving(true);
    setError("");

    try {
      await missingInfoApi.create(projectId, newMissingInfo);

      // Refresh missing info list
      const response = await scoreApi.getMissingInfo(projectId);
      setMissingInfo(response.data.items);

      // Reset form
      setNewMissingInfo({
        dimension: "",
        information_type: "",
        description: "",
        status: "pending"
      });

      console.log("✅ Missing info added successfully");
    } catch (err: any) {
      console.error("❌ Add missing info failed:", err);
      setError(err.response?.data?.message || "添加缺失信息失败");
    } finally {
      setMissingInfoSaving(false);
    }
  }, [projectId, newMissingInfo, missingInfoSaving]);

  const handleDeleteMissingInfo = useCallback(async (infoId: string) => {
    console.log("entered handleDeleteMissingInfo");
    if (!confirm("确定要删除这条缺失信息吗？")) return;

    // FIXED: Prevent multiple deletes
    if (missingInfoSaving) return;

    setMissingInfoSaving(true);
    setError("");

    try {
      await missingInfoApi.delete(projectId, infoId);

      // Update local state
      setMissingInfo(prev => prev.filter(info => info.id !== infoId));

      console.log("✅ Missing info deleted successfully");
    } catch (err: any) {
      console.error("❌ Delete missing info failed:", err);
      setError(err.response?.data?.message || "删除缺失信息失败");
    } finally {
      setMissingInfoSaving(false);
    }
  }, [projectId, missingInfoSaving]);

  // Initial data loading
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectRes, scoresRes, missingInfoRes] = await Promise.all([
          projectApi.getDetail(projectId),
          scoreApi.getScores(projectId),
          scoreApi.getMissingInfo(projectId), // Use existing API for backward compatibility
        ]);

        setProject(projectRes.data);
        setScores(scoresRes.data.dimensions);
        originalScoresRef.current = [...scoresRes.data.dimensions];
        setMissingInfo(missingInfoRes.data.items);

        // Set team members state
        const teamMembersValue = projectRes.data.team_members || "";
        setTeamMembers(teamMembersValue);
        setOriginalTeamMembers(teamMembersValue);

        // Try to get BP info
        try {
          const bpInfoRes = await businessPlanApi.getInfo(projectId);
          setBpInfo(bpInfoRes.data);
        } catch (bpError) {
          console.log("No BP found for project:", projectId);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "获取项目详情失败");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [projectId]);

  // BP download handler
  const handleDownloadBP = async () => {
    if (!bpInfo?.file_exists) {
      setError("商业计划书文件不存在");
      return;
    }
    setDownloadingBP(true);
    try {
      await businessPlanApi.downloadAndSave(projectId, bpInfo.file_name);
    } catch (err: any) {
      setError(err.response?.data?.message || '下载文件失败');
    } finally {
      setDownloadingBP(false);
    }
  };

  // History handlers
  const handleOpenHistory = async () => {
    setShowHistory(true);
    setHistoryLoading(true);
    try {
      const response = await scoreApi.getScoreHistory(projectId);
      setHistoryList(response.data.history || []);
    } catch (err: any) {
      console.error("Failed to fetch score history:", err);
      setError("获取评分历史失败");
    } finally {
      setHistoryLoading(false);
    }
  };

  // Delete project handler
  const handleDeleteProject = async () => {
    setDeleting(true);
    try {
      await projectApi.delete(projectId);
      setTimeout(() => router.push('/dashboard'), 500);
    } catch (err: any) {
      setError(err.response?.data?.message || "删除项目失败，请重试");
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  // Dimension metadata for styling
  const dimensionMeta: Record<string, { icon: string; color: string; text: string }> = {
    "团队能力": { icon: "fa-users", color: "text-purple-400", text: "text-purple-600" },
    "产品&技术": { icon: "fa-microchip", color: "text-pink-400", text: "text-pink-600" },
    "市场前景": { icon: "fa-chart-line", color: "text-blue-400", text: "text-blue-600" },
    "商业模式": { icon: "fa-briefcase", color: "text-green-400", text: "text-green-600" },
    "财务情况": { icon: "fa-coins", color: "text-yellow-400", text: "text-yellow-600" },
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f3e8ff 100%)' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">加载中...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error && !project) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f3e8ff 100%)' }}>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen flex flex-col" style={{ fontFamily: 'Inter, sans-serif', background: 'linear-gradient(135deg, #f8fafc 0%, #f3e8ff 100%)' }}>
        <main className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-6xl mx-auto py-12">
            {/* Error Display */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
            )}

            {/* Project Information Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              {/* Project Info Card - ENHANCED */}
              <div className="md:col-span-2 bg-white rounded-2xl shadow p-8 flex flex-col justify-between relative">
                <div>
                  {/* History Button */}
                  <button
                    onClick={handleOpenHistory}
                    className="absolute top-4 right-4 border border-red-400 rounded-lg px-2 py-1 text-red-400 hover:bg-red-50 transition flex items-center"
                    title="查看企业评分历史"
                  >
                    <i className="fa-solid fa-clock-rotate-left mr-1"></i>评分历史
                  </button>

                  <div className="flex items-center mb-4">
                    <div className="text-2xl font-bold text-gray-800 mr-4">{project.project_name}</div>
                    {(() => {
                      const statusTag = getStatusTag(project.status);
                      return (
                        <span className={statusTag.className}>
                          <i className={`fa-solid ${statusTag.icon} mr-1`}></i>
                          {statusTag.display}
                        </span>
                      );
                    })()}
                  </div>

                  <div className="text-gray-500 mb-2">
                    <i className="fa-solid fa-building mr-1"></i> {project.enterprise_name}
                  </div>
                  <div className="text-gray-400 text-sm mb-4">
                    提交时间：{project.created_at?.slice(0, 10)}
                  </div>

                  {/* BP Document Link */}
                  <div className="mb-4">
                    {bpInfo?.file_exists ? (
                      <button
                        onClick={() => {/* BP download handler */}}
                        disabled={downloadingBP}
                        className="inline-flex items-center text-purple-500 hover:underline text-sm disabled:opacity-50"
                      >
                        <i className={`fa-solid ${downloadingBP ? 'fa-spinner fa-spin' : 'fa-file-pdf'} mr-1`}></i>
                        {downloadingBP ? '下载中...' : '查看BP文档'}
                      </button>
                    ) : (
                      <span className="inline-flex items-center text-gray-400 text-sm">
                        <i className="fa-solid fa-file-pdf mr-1"></i> 暂无BP文档
                      </span>
                    )}
                  </div>

                  {/* NEW: Enhanced Team Info with Editing */}
                  <div className="bg-gray-100 rounded-xl p-4 flex items-start">
                    <i className="fa-solid fa-user-group text-purple-400 text-xl mr-3 mt-1"></i>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-gray-700 font-semibold">团队成员：</div>
                        {!isEditingTeam && (
                          <button
                            onClick={handleStartEditTeam}
                            className="text-purple-500 hover:text-purple-700 text-sm flex items-center"
                          >
                            <i className="fa-solid fa-pen mr-1"></i> 编辑
                          </button>
                        )}
                      </div>

                      {isEditingTeam ? (
                        <div>
                          <textarea
                            value={teamMembers}
                            onChange={(e) => setTeamMembers(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm resize-none"
                            rows={3}
                            placeholder="请输入团队成员信息，例如：张三（CEO）、李四（CTO）、王五（COO）"
                            disabled={teamSaving}
                          />
                          {teamError && (
                            <div className="text-red-500 text-xs mt-1">{teamError}</div>
                          )}
                          <div className="flex space-x-2 mt-2">
                            <button
                              onClick={handleSaveTeam}
                              disabled={teamSaving}
                              className="px-3 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600 disabled:opacity-50"
                            >
                              {teamSaving ? '保存中...' : '保存'}
                            </button>
                            <button
                              onClick={handleCancelTeam}
                              disabled={teamSaving}
                              className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-xs hover:bg-gray-400 disabled:opacity-50"
                            >
                              取消
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-500 text-sm">
                          {getTeamMembersDisplay(teamMembers)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* BP Preview Card */}
              <div className="bg-white rounded-2xl shadow p-8 flex flex-col items-center justify-center">
                <div className="w-full h-64 bg-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-2xl">
                  <div className="text-center">
                    <i className="fa-solid fa-file-pdf mr-2"></i>
                    <div className="text-sm mt-2">
                      {bpInfo?.file_exists ? `${bpInfo.file_name}` : 'BP文档预览'}
                    </div>
                    {bpInfo?.file_size && (
                      <div className="text-xs text-gray-500 mt-1">
                        {Math.round(bpInfo.file_size / 1024 / 1024 * 100) / 100} MB
                      </div>
                    )}
                  </div>
                </div>

                {bpInfo?.file_exists ? (
                  <button
                    onClick={handleDownloadBP}
                    disabled={downloadingBP}
                    className="mt-4 text-purple-500 hover:underline text-sm flex items-center disabled:opacity-50"
                  >
                    <i className={`fa-solid ${downloadingBP ? 'fa-spinner fa-spin' : 'fa-download'} mr-1`}></i>
                    {downloadingBP ? '下载中...' : '下载BP'}
                  </button>
                ) : (
                  <span className="mt-4 text-gray-400 text-sm flex items-center">
                    <i className="fa-solid fa-download mr-1"></i> 暂无文件
                  </span>
                )}
              </div>
            </div>

            {/* Score Cards Section */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              {scores.map((score) => {
                const meta = dimensionMeta[score.dimension] || { icon: "fa-star", color: "text-gray-400", text: "text-gray-600" };
                const missing = missingInfo.find((m) => m.dimension === score.dimension);

                return (
                  <div key={score.dimension} className="bg-white rounded-2xl shadow p-6 flex flex-col transition-all duration-300 hover:shadow-lg">
                    <div className="flex items-center mb-2">
                      <i className={`fa-solid ${meta.icon} ${meta.color} mr-2`}></i>
                      <span className="font-semibold text-gray-700">{score.dimension}</span>

                      {isEditing ? (
                        <div className="ml-auto flex items-center bg-gray-50 rounded-lg px-2 py-1 border border-gray-200 focus-within:ring-2 focus-within:ring-purple-400 transition-all duration-200 shadow-sm">
                          <input
                            type="number"
                            min="0"
                            max={score.max_score}
                            step="0.1"
                            value={score.score}
                            onChange={(e) => handleScoreInputChange(score.dimension, e.target.value)}
                            disabled={isSaving}
                            className="w-12 text-center font-bold text-lg bg-transparent outline-none border-none focus:ring-0 text-gray-800 disabled:opacity-50"
                          />
                          <span className="mx-1 text-gray-300 text-lg font-normal select-none">/</span>
                          <span className="text-gray-400 text-base font-normal select-none">{score.max_score}</span>
                        </div>
                      ) : (
                        <span className={`ml-auto text-lg font-bold ${meta.text} transition-all duration-300`}>
                          {score.score}/{score.max_score}
                        </span>
                      )}
                    </div>

                    {isEditing ? (
                      <textarea
                        value={score.comments || ''}
                        onChange={(e) => handleScoreChange(score.dimension, 'comments', e.target.value)}
                        disabled={isSaving}
                        className="text-gray-800 text-base mb-2 p-3 rounded-lg border border-gray-200 resize-none w-full focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-200 bg-gray-50 hover:bg-white min-h-[80px] disabled:opacity-50"
                        rows={3}
                        placeholder="请输入评语..."
                      />
                    ) : (
                      <div className="text-gray-500 text-sm mb-2 transition-all duration-300">
                        {score.comments || '暂无评语'}
                      </div>
                    )}

                    {missing && (
                      <div className="text-xs text-yellow-500 mt-2">
                        <i className="fa-solid fa-circle-exclamation mr-1"></i> 缺失：{missing.description}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* NEW: Enhanced Missing Information Section */}
            <div className="bg-white rounded-2xl shadow p-8 mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-semibold text-gray-700 flex items-center">
                  <i className="fa-solid fa-circle-exclamation text-yellow-400 mr-2"></i>
                  缺失信息管理
                </div>
                <button
                  onClick={() => setIsAddingMissingInfo(!isAddingMissingInfo)}
                  className="text-purple-500 hover:text-purple-700 text-sm flex items-center"
                >
                  <i className={`fa-solid ${isAddingMissingInfo ? 'fa-times' : 'fa-plus'} mr-1`}></i>
                  {isAddingMissingInfo ? '取消添加' : '添加缺失信息'}
                </button>
              </div>

              {/* Add New Missing Info Form */}
              {isAddingMissingInfo && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">维度</label>
                      <select
                        value={newMissingInfo.dimension}
                        onChange={(e) => setNewMissingInfo(prev => ({ ...prev, dimension: e.target.value }))}
                        className="w-full p-2 border border-gray-300 rounded text-sm"
                      >
                        <option value="">选择维度</option>
                        <option value="团队能力">团队能力</option>
                        <option value="产品&技术">产品&技术</option>
                        <option value="市场前景">市场前景</option>
                        <option value="商业模式">商业模式</option>
                        <option value="财务情况">财务情况</option>
                        <option value="其他">其他</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">信息类型</label>
                      <input
                        type="text"
                        value={newMissingInfo.information_type}
                        onChange={(e) => setNewMissingInfo(prev => ({ ...prev, information_type: e.target.value }))}
                        className="w-full p-2 border border-gray-300 rounded text-sm"
                        placeholder="例如：财务报表"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                      <select
                        value={newMissingInfo.status}
                        onChange={(e) => setNewMissingInfo(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full p-2 border border-gray-300 rounded text-sm"
                      >
                        <option value="pending">待处理</option>
                        <option value="provided">已提供</option>
                        <option value="resolved">已解决</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                    <textarea
                      value={newMissingInfo.description}
                      onChange={(e) => setNewMissingInfo(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded text-sm resize-none"
                      rows={2}
                      placeholder="请详细描述缺失的信息内容"
                    />
                  </div>
                  <div className="flex space-x-2 mt-4">
                    <button
                      onClick={handleAddMissingInfo}
                      disabled={missingInfoSaving}
                      className="px-4 py-2 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 disabled:opacity-50"
                    >
                      {missingInfoSaving ? '添加中...' : '添加'}
                    </button>
                  </div>
                </div>
              )}

              {/* FIXED: Missing Info List - REMOVED EDITING FUNCTIONALITY */}
              <div className="space-y-3">
                {missingInfo.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">
                    <i className="fa-solid fa-check-circle text-green-400 text-2xl mb-2"></i>
                    <div>无缺失信息</div>
                  </div>
                ) : (
                  missingInfo.map((info, idx) => {
                    const statusConfig = getMissingInfoStatusColor(info.status);

                    return (
                      <div key={info.id || idx} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        {/* REMOVED: Editing functionality - now only display */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <span className="font-medium text-gray-800 mr-2">{info.dimension}</span>
                              <span className="text-gray-600 text-sm mr-2">·</span>
                              <span className="text-gray-600 text-sm mr-2">{info.information_type}</span>
                              <span className={`inline-block px-2 py-1 rounded-full ${statusConfig.bg} ${statusConfig.text} text-xs`}>
                                <i className={`fa-solid ${statusConfig.icon} mr-1`}></i>
                                {getMissingInfoStatusDisplay(info.status)}
                              </span>
                            </div>
                            <div className="text-gray-600 text-sm">{info.description}</div>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            {/* REMOVED: Edit button - only delete now */}
                            <button
                              onClick={() => info.id && handleDeleteMissingInfo(info.id)}
                              disabled={!info.id || missingInfoSaving}
                              className="text-red-500 hover:text-red-700 text-sm disabled:opacity-50 flex items-center"
                            >
                              {missingInfoSaving ? (
                                <i className="fa-solid fa-spinner fa-spin"></i>
                              ) : (
                                <i className="fa-solid fa-trash"></i>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="px-6 py-3 rounded-xl border border-gray-300 text-gray-600 font-semibold text-lg hover:bg-gray-50 transition-all duration-200 hover:border-gray-400 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <i className="fa-solid fa-xmark mr-2"></i> 取消
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-8 py-3 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-400 text-white font-semibold text-lg shadow hover:from-purple-600 hover:to-pink-500 transition-all duration-200 hover:shadow-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <i className={`fa-solid ${isSaving ? 'fa-spinner fa-spin' : 'fa-save'} mr-2`}></i>
                    {isSaving ? '保存中...' : '保存修改'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={deleting}
                    className="px-6 py-3 rounded-xl border border-red-300 text-red-600 font-semibold text-lg hover:bg-red-50 transition-all duration-200 hover:border-red-400 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <i className={`fa-solid ${deleting ? 'fa-spinner fa-spin' : 'fa-trash'} mr-2`}></i>
                    {deleting ? '删除中...' : '删除项目'}
                  </button>

                  <button
                    onClick={handleStartEdit}
                    className="px-6 py-3 rounded-xl border border-gray-300 text-gray-600 font-semibold text-lg hover:bg-gray-50 transition flex items-center"
                  >
                    <i className="fa-solid fa-pen mr-2"></i> 修改评分
                  </button>

                  <button
                    onClick={() => router.push(`/projects/${projectId}/report`)}
                    className="px-8 py-3 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-400 text-white font-semibold text-lg shadow hover:from-purple-600 hover:to-pink-500 transition flex items-center"
                  >
                    <i className="fa-solid fa-file-arrow-down mr-2"></i> 下载报告
                  </button>
                </>
              )}
            </div>
          </div>
        </main>

        {/* History Modal */}
        {showHistory && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-4xl max-h-[80vh] overflow-hidden relative">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                onClick={() => setShowHistory(false)}
              >
                <i className="fa-solid fa-xmark text-2xl"></i>
              </button>

              <div className="text-xl font-bold mb-6 text-gray-800 flex items-center">
                <i className="fa-solid fa-clock-rotate-left text-purple-500 mr-2"></i>
                评分变更历史
              </div>

              {historyLoading ? (
                <div className="text-center text-gray-600 text-base py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                  加载历史记录中...
                </div>
              ) : historyList.length === 0 ? (
                <div className="text-center text-gray-600 text-base py-8">
                  <i className="fa-solid fa-history text-4xl text-gray-300 mb-4"></i>
                  <div>暂无评分变更历史</div>
                </div>
              ) : (
                <div className="overflow-y-auto max-h-96">
                  <div className="space-y-4">
                    {historyList.map((historyItem, index) => (
                      <div key={historyItem.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <span className="inline-block w-6 h-6 bg-purple-100 text-purple-600 rounded-full text-xs flex items-center justify-center font-semibold mr-3">
                              {index + 1}
                            </span>
                            <div>
                              <div className="font-semibold text-gray-800">
                                总分：{historyItem.total_score}/100
                              </div>
                              <div className="text-xs text-gray-500">
                                {historyItem.modification_notes || '评分更新'}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">
                              {new Date(historyItem.created_at).toLocaleDateString('zh-CN')}
                            </div>
                            <div className="text-xs text-gray-400">
                              修改人：{historyItem.modified_by}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 pt-4 border-t flex justify-end">
                <button
                  onClick={() => setShowHistory(false)}
                  className="px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fa-solid fa-exclamation-triangle text-red-500 text-2xl"></i>
                </div>

                <div className="text-xl font-bold text-gray-800 mb-2">确认删除项目</div>

                <div className="text-gray-600 mb-2">您即将删除以下项目：</div>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="font-semibold text-gray-800">{project?.project_name}</div>
                  <div className="text-sm text-gray-600">{project?.enterprise_name}</div>
                </div>

                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                  <i className="fa-solid fa-warning mr-2"></i>
                  <strong>警告：</strong>此操作无法撤销！
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleting}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleDeleteProject}
                    disabled={deleting}
                    className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center"
                  >
                    <i className={`fa-solid ${deleting ? 'fa-spinner fa-spin' : 'fa-trash'} mr-2`}></i>
                    {deleting ? '删除中...' : '确认删除'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FontAwesome CDN */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </div>
    </Layout>
  );
}