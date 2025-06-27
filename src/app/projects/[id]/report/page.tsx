"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { projectApi, scoreApi } from "@/lib/api";
import type { Score, MissingInfo} from "@/lib/types";
import { getStatusTag, getRecommendationFromScore } from "@/lib/types";
import Layout from '@/components/Layout';
import { businessPlanApi } from "@/lib/api";

export default function ProjectReportPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<any>(null);
  const [scores, setScores] = useState<Score[]>([]);
  const [missingInfo, setMissingInfo] = useState<MissingInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bpInfo, setBpInfo] = useState<any>(null);
  const [downloadingBP, setDownloadingBP] = useState(false);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectRes, scoresRes, missingInfoRes] = await Promise.all([
          projectApi.getDetail(projectId),
          scoreApi.getScores(projectId),
          scoreApi.getMissingInfo(projectId),
        ]);
        setProject(projectRes.data);
        setScores(scoresRes.data.dimensions);
        setMissingInfo(missingInfoRes.data.items);

        // Try to get BP info
        try {
          const bpInfoRes = await businessPlanApi.getInfo(projectId);
          setBpInfo(bpInfoRes.data);
        } catch (bpError) {
          console.log("No BP found for project:", projectId);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "获取报告失败");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [projectId]);

  const handleDownloadReport = () => {
    // Add minimal print styles to hide the button
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        button { display: none !important; }
        .shadow, .shadow-2xl { box-shadow: none !important; }
      }
    `;
    document.head.appendChild(style);

    // Use browser's native print
    window.print();

    // Clean up the style after printing
    setTimeout(() => {
      document.head.removeChild(style);
    }, 1000);
  };

  const getRecommendationFromScore = (score: number | null | undefined): string => {
    if (score === null || score === undefined) {
      return '等待评估';
    } else if (score >= 80) {
      return '优秀项目，可考虑给予企业工位';
    } else if (score >= 60) {
      return '符合基本入孵条件，可注册在工研院';
    } else {
      return '暂不符合入孵条件，建议完善后重新提交';
    }
  };

  // 评分维度图标和配色
  const dimensionMeta: Record<string, { icon: string; color: string; text: string }> = {
    "团队能力": { icon: "fa-users", color: "text-purple-400", text: "text-purple-600" },
    "产品&技术": { icon: "fa-microchip", color: "text-pink-400", text: "text-pink-600" },
    "市场前景": { icon: "fa-chart-line", color: "text-blue-400", text: "text-blue-600" },
    "商业模式": { icon: "fa-briefcase", color: "text-green-400", text: "text-green-600" },
    "财务情况": { icon: "fa-coins", color: "text-yellow-400", text: "text-yellow-600" },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f3e8ff 100%)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f3e8ff 100%)' }}>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen flex flex-col" style={{ fontFamily: 'Inter, sans-serif', background: 'linear-gradient(135deg, #f8fafc 0%, #f3e8ff 100%)' }}>
        <main className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-4xl mx-auto py-12">
            {/* 项目信息卡片 */}
            <div className="bg-white rounded-3xl shadow-2xl p-10 mb-8 relative">
              <button
                onClick={handleDownloadReport}
                className="absolute top-6 right-6 px-5 py-2 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-400 text-white font-semibold shadow hover:from-purple-600 hover:to-pink-500 transition flex items-center z-10"
              >
                <i className="fa-solid fa-print mr-2"></i> 保存为PDF
              </button>

              <div className="flex items-center mb-4">
                <div className="text-2xl font-bold text-gray-800 mr-4">{project.project_name}</div>
                <span className="inline-block px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs">{project.enterprise_name}</span>
              </div>
              <div className="text-gray-400 text-sm mb-2">提交时间：{project.created_at?.slice(0, 10)}</div>
              <div className="flex items-center mb-2">
                <span className="text-lg font-bold text-purple-600 mr-4">总分：{project.total_score ?? '--'}/100</span>
                {(() => {
                  const recommendation = getRecommendationFromScore(project.total_score);

                  // Determine icon and color based on score
                  let iconClass = "fa-clock";
                  let bgColor = "bg-gray-100";
                  let textColor = "text-gray-700";

                  if (project.total_score !== null && project.total_score !== undefined) {
                    if (project.total_score >= 80) {
                      iconClass = "fa-check-circle";
                      bgColor = "bg-green-100";
                      textColor = "text-green-700";
                    } else if (project.total_score >= 60) {
                      iconClass = "fa-clock";
                      bgColor = "bg-yellow-100";
                      textColor = "text-yellow-700";
                    } else {
                      iconClass = "fa-times-circle";
                      bgColor = "bg-red-100";
                      textColor = "text-red-700";
                    }
                  }

                  return (
                    <span className={`inline-block px-3 py-1 rounded-full ${bgColor} ${textColor} text-xs`}>
                      <i className={`fa-solid ${iconClass} mr-1`}></i>
                      {recommendation}
                    </span>
                  );
                })()}
              </div>
              <div className="mb-2">
                <div className="mb-2">
                  {bpInfo?.file_exists ? (
                    <button
                      onClick={handleDownloadBP}
                      disabled={downloadingBP}
                      className="text-purple-500 hover:underline text-sm flex items-center disabled:opacity-50 no-print"
                    >
                      <i className={`fa-solid ${downloadingBP ? 'fa-spinner fa-spin' : 'fa-file-pdf'} mr-1`}></i>
                      {downloadingBP ? '下载中...' : '查看BP文档'}
                    </button>
                  ) : (
                    <span className="text-gray-400 text-sm flex items-center">
                      <i className="fa-solid fa-file-pdf mr-1"></i> 暂无BP文档
                    </span>
                  )}
                </div>
              </div>
            </div>
            {/* 评分维度卡片区 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {scores.map((score) => {
                const meta = dimensionMeta[score.dimension] || { icon: "fa-star", color: "text-gray-400", text: "text-gray-600" };
                return (
                  <div key={score.dimension} className="bg-white rounded-2xl shadow p-6 flex flex-col">
                    <div className="flex items-center mb-2">
                      <i className={`fa-solid ${meta.icon} ${meta.color} mr-2`}></i>
                      <span className="font-semibold text-gray-700">{score.dimension}</span>
                      <span className={`ml-auto text-lg font-bold ${meta.text}`}>{score.score}/{score.max_score}</span>
                    </div>
                    <div className="text-gray-500 text-sm mb-2">{score.comments}</div>
                  </div>
                );
              })}
            </div>
            {/* 缺失信息卡片 */}
            <div className="bg-white rounded-2xl shadow p-8">
              <div className="text-lg font-semibold text-gray-700 mb-4 flex items-center"><i className="fa-solid fa-circle-exclamation text-yellow-400 mr-2"></i> 缺失信息清单</div>
              <ul className="list-disc pl-6 text-gray-500 text-sm space-y-1">
                {missingInfo.length === 0 ? (
                  <li>无缺失信息</li>
                ) : (
                  missingInfo.map((info, idx) => (
                    <li key={idx}>{info.description}</li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </main>
        {/* 引入FontAwesome CDN */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </div>
    </Layout>
  );
}