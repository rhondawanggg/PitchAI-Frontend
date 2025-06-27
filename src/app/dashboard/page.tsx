"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { projectApi } from "@/lib/api";
import Layout from '@/components/Layout';
import { Project, ProjectStatistics } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [statistics, setStatistics] = useState<ProjectStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allProjectsResponse, statisticsResponse] = await Promise.all([
          projectApi.list({ size: 1000 }),
          projectApi.getStatistics()
        ]);
        setAllProjects(allProjectsResponse.data.items);
        setStatistics(statisticsResponse.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "获取数据失败");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Helper function to get status display
  const getStatusDisplay = (status: Project['status']): string => {
    const statusMap = {
      'pending_review': '待评审',
      'processing': '处理中',
      'completed': '已完成',
      'failed': '未通过'
    };
    return statusMap[status] || '未知';
  };

  // Helper function to get status tag
  const getStatusTag = (status: Project['status']) => {
    const statusConfig = {
      'pending_review': {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        icon: 'fa-clock'
      },
      'processing': {
        bg: 'bg-purple-100',
        text: 'text-purple-700',
        icon: 'fa-spinner fa-spin'
      },
      'completed': {
        bg: 'bg-green-100',
        text: 'text-green-700',
        icon: 'fa-check-circle'
      },
      'failed': {
        bg: 'bg-red-100',
        text: 'text-red-700',
        icon: 'fa-times-circle'
      }
    };

    const config = statusConfig[status] || statusConfig['processing'];
    const display = getStatusDisplay(status);

    return (
      <span className={`inline-block px-3 py-1 rounded-full ${config.bg} ${config.text} text-xs`}>
        <i className={`fa-solid ${config.icon} mr-1`}></i>
        {display}
      </span>
    );
  };

  // Statistics configuration with proper fallbacks
  const stats = statistics ? [
    {
      icon: "fa-check-circle",
      color: "from-green-400 to-blue-400",
      label: "已完成 (≥80分)",
      value: statistics.completed || 0,
      description: "优秀项目"
    },
    {
      icon: "fa-clock",
      color: "from-yellow-400 to-orange-400",
      label: "待评审 (60-79分)",
      value: statistics.pending_review || 0,
      description: "符合基本条件"
    },
    {
      icon: "fa-times-circle",
      color: "from-red-400 to-pink-400",
      label: "未通过 (<60分)",
      value: statistics.failed || 0,
      description: "需要完善"
    },
    {
      icon: "fa-hourglass-half",
      color: "from-purple-500 to-pink-400",
      label: "处理中",
      value: statistics.processing || 0,
      description: "等待评估"
    },
  ] : [];

  // Group projects by status
  const groupedProjects = {
    completed: allProjects.filter(p => p.status === 'completed'),
    pending_review: allProjects.filter(p => p.status === 'pending_review'),
    failed: allProjects.filter(p => p.status === 'failed'),
    processing: allProjects.filter(p => p.status === 'processing')
  };

  // FIXED: Define consistent table header component with standardized widths
  const TableHeader = () => (
    <thead>
      <tr className="text-gray-400 text-sm">
        <th className="py-2 w-1/3 text-left">项目名称</th>
        <th className="py-2 w-1/4 text-left">企业名称</th>
        <th className="py-2 w-1/6 text-left">评分</th>
        <th className="py-2 w-1/6 text-left">操作</th>
      </tr>
    </thead>
  );

  // FIXED: Define consistent table row component with standardized widths
  const ProjectTableRow = ({ project, showScore = true }: { project: Project; showScore?: boolean }) => (
    <tr className="border-t hover:bg-gray-50">
      <td className="py-3 font-medium text-gray-800 w-1/3">{project.project_name}</td>
      <td className="py-3 text-gray-600 w-1/4">{project.enterprise_name}</td>
      <td className="py-3 w-1/6">
        {showScore ? (
          <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
            {project.total_score}/100
          </span>
        ) : (
          getStatusTag(project.status)
        )}
      </td>
      <td className="py-3 w-1/6">
        <button onClick={() => router.push(`/projects/${project.id}`)} className="text-purple-500 hover:underline text-sm">查看详情</button>
      </td>
    </tr>
  );

  return (
    <Layout>
      <main className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-6xl mx-auto py-12">
          {/* Welcome section */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 to-pink-400 flex items-center justify-center mr-3 shadow">
                <i className="fa-solid fa-brain text-white text-2xl"></i>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800 mb-1">欢迎回来，评审专家！</div>
                <div className="text-gray-400">快速查看您的评审任务和项目进展</div>
              </div>
            </div>
            <button
              onClick={() => router.push('/projects/new')}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-400 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <i className="fa-solid fa-plus mr-2"></i>
              新建项目
            </button>
          </div>

          {/* Statistics cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl shadow flex flex-col items-center p-6 transition hover:shadow-xl">
                <div className={`w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-tr ${stat.color} text-white text-2xl mb-3`}>
                  <i className={`fa-solid ${stat.icon}`}></i>
                </div>
                <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
                <div className="text-gray-700 font-medium text-center">{stat.label}</div>
                <div className="text-gray-400 text-xs text-center mt-1">{stat.description}</div>
              </div>
            ))}
          </div>

          {/* FIXED: Organized project display by status with consistent table structure */}
          <div className="space-y-8">
            {/* Completed projects */}
            {groupedProjects.completed.length > 0 && (
              <div className="bg-white rounded-2xl shadow p-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-lg font-semibold text-gray-700 flex items-center">
                    <i className="fa-solid fa-check-circle text-green-500 mr-2"></i>
                    已完成项目 (≥80分)
                    <span className="ml-2 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                      {groupedProjects.completed.length}
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left table-fixed">
                    <TableHeader />
                    <tbody>
                      {groupedProjects.completed.map((project) => (
                        <ProjectTableRow key={project.id} project={project} showScore={true} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pending review projects */}
            {groupedProjects.pending_review.length > 0 && (
              <div className="bg-white rounded-2xl shadow p-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-lg font-semibold text-gray-700 flex items-center">
                    <i className="fa-solid fa-clock text-yellow-500 mr-2"></i>
                    待评审项目 (60-79分)
                    <span className="ml-2 bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">
                      {groupedProjects.pending_review.length}
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left table-fixed">
                    <TableHeader />
                    <tbody>
                      {groupedProjects.pending_review.map((project) => (
                        <ProjectTableRow key={project.id} project={project} showScore={true} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Failed projects */}
            {groupedProjects.failed.length > 0 && (
              <div className="bg-white rounded-2xl shadow p-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-lg font-semibold text-gray-700 flex items-center">
                    <i className="fa-solid fa-times-circle text-red-500 mr-2"></i>
                    未通过项目 (&lt;60分)
                    <span className="ml-2 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">
                      {groupedProjects.failed.length}
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left table-fixed">
                    <TableHeader />
                    <tbody>
                      {groupedProjects.failed.map((project) => (
                        <ProjectTableRow key={project.id} project={project} showScore={true} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Processing projects */}
            {groupedProjects.processing.length > 0 && (
              <div className="bg-white rounded-2xl shadow p-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-lg font-semibold text-gray-700 flex items-center">
                    <i className="fa-solid fa-spinner fa-spin text-purple-500 mr-2"></i>
                    处理中项目
                    <span className="ml-2 bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">
                      {groupedProjects.processing.length}
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left table-fixed">
                    <thead>
                      <tr className="text-gray-400 text-sm">
                        <th className="py-2 w-1/3 text-left">项目名称</th>
                        <th className="py-2 w-1/4 text-left">企业名称</th>
                        <th className="py-2 w-1/6 text-left">状态</th>
                        <th className="py-2 w-1/6 text-left">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedProjects.processing.map((project) => (
                        <ProjectTableRow key={project.id} project={project} showScore={false} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Empty state */}
            {allProjects.length === 0 && !loading && (
              <div className="bg-white rounded-2xl shadow p-8 text-center">
                <div className="text-gray-400 text-lg mb-4">
                  <i className="fa-solid fa-folder-open text-4xl mb-4"></i>
                  <div>暂无项目数据</div>
                </div>
                <button
                  onClick={() => router.push('/projects/new')}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-400 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <i className="fa-solid fa-plus mr-2"></i>
                  创建第一个项目
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
          )}

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">加载中...</p>
            </div>
          )}
        </div>
      </main>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    </Layout>
  );
}