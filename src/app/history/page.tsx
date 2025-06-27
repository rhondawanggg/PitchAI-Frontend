"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { projectApi } from "@/lib/api";
import { getStatusTag } from "@/lib/types";

export default function HistoryPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await projectApi.list({ search: search || undefined, status: status || undefined });
        setProjects(response.data.items);
      } catch (err: any) {
        setError(err.response?.data?.message || "获取项目列表失败");
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [search, status]);

  const getStatusDisplay = (status: string): string => {
    const statusMap = {
      'pending_review': '待评审',
      'processing': '处理中',
      'completed': '已完成',
      'failed': '未通过'
    };
    return statusMap[status as keyof typeof statusMap] || '未知';
  };

  // 状态标签样式
  const getStatusTagJSX = (status: string) => {
    const statusConfig = {
      'pending_review': { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: 'fa-clock' },
      'processing': { bg: 'bg-purple-100', text: 'text-purple-700', icon: 'fa-spinner fa-spin' },
      'completed': { bg: 'bg-green-100', text: 'text-green-700', icon: 'fa-check-circle' },
      'failed': { bg: 'bg-red-100', text: 'text-red-700', icon: 'fa-times-circle' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['processing'];
    const display = getStatusDisplay(status);

    return (
      <span className={`inline-block px-3 py-1 rounded-full ${config.bg} ${config.text} text-xs`}>
        <i className={`fa-solid ${config.icon} mr-1`}></i>
        {display}
      </span>
    );
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: 'Inter, sans-serif', background: 'linear-gradient(135deg, #f8fafc 0%, #f3e8ff 100%)' }}>
      {/* 顶部品牌栏 */}
      <header className="w-full py-4 px-8 bg-white shadow flex items-center justify-between">
        <span className="text-2xl font-extrabold bg-gradient-to-tr from-purple-500 to-pink-400 bg-clip-text text-transparent tracking-wide">PitchAI</span>
      </header>
      <main className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-6xl mx-auto py-12">
          <div className="bg-white rounded-3xl shadow-2xl p-10 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="text-2xl font-bold text-gray-800 flex items-center"><i className="fa-solid fa-clock-rotate-left text-purple-500 mr-2"></i> 历史评审记录</div>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="搜索项目/企业"
                  className="px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-purple-400 focus:outline-none text-sm"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <select
                  className="px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-purple-400 focus:outline-none"
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                >
                  <option value="">全部状态</option>
                  <option value="processing">处理中</option>
                  <option value="pending_review">待评审 (60-79分)</option>
                  <option value="completed">已完成 (≥80分)</option>
                  <option value="failed">未通过 (&lt;60分)</option>
                </select>
              </div>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-400 text-sm">
                  <th className="py-2">项目名称</th>
                  <th className="py-2">企业名称</th>
                  <th className="py-2">评审时间</th>
                  <th className="py-2">总分</th>
                  <th className="py-2">状态</th>
                  <th className="py-2">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="py-6 text-center text-gray-400">加载中...</td></tr>
                ) : projects.length === 0 ? (
                  <tr><td colSpan={6} className="py-6 text-center text-gray-400">暂无项目数据</td></tr>
                ) : (
                  projects.map((project) => (
                    <tr key={project.id} className="border-t hover:bg-gray-50">
                      <td className="py-3 font-medium text-gray-800">{project.project_name}</td>
                      <td className="py-3 text-gray-600">{project.enterprise_name}</td>
                      <td className="py-3 text-gray-500">{project.created_at?.slice(0, 10)}</td>
                      <td className="py-3"><span className="inline-block px-3 py-1 rounded-full bg-gradient-to-tr from-purple-500 to-pink-400 text-white text-xs">{project.total_score ?? '--'}</span></td>
                      <td className="py-3">{getStatusTagJSX(project.status)}</td>
                      <td className="py-3">
                        <button onClick={() => router.push(`/projects/${project.id}/report`)} className="text-purple-500 hover:underline text-sm">查看报告</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      {/* 引入FontAwesome CDN */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    </div>
  );
}