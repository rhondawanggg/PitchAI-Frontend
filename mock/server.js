const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;
const API_PREFIX = '/api/v1';

// 通用响应格式
const successResponse = (data) => ({
  code: 200,
  message: 'success',
  data
});

const errorResponse = (code, message, errors = []) => ({
  code,
  message,
  errors
});

// Dashboard统计信息
app.get(`${API_PREFIX}/projects/statistics`, (req, res) => {
  res.json(successResponse({
    pending_review: 20,
    completed: 11,
    needs_info: 5,
    recent_projects: [
      {
        id: '1',
        enterprise_name: '北方科技',
        project_name: 'AI智能投研',
        status: 'completed',
        total_score: 88,
        review_result: 'pass',
        created_at: '2024-05-01T12:00:00Z'
      },
      {
        id: '2',
        enterprise_name: '南方科技',
        project_name: '区块链金融',
        status: 'pending_review',
        total_score: null,
        review_result: null,
        created_at: '2024-05-02T12:00:00Z'
      }
    ]
  }));
});

// 项目列表
app.get(`${API_PREFIX}/projects`, (req, res) => {
  const { page = 1, size = 10, status, search } = req.query;
  res.json(successResponse({
    total: 2,
    items: [
      {
        id: '1',
        enterprise_name: '东方科技',
        project_name: 'AI智能投研',
        status: 'completed',
        total_score: 88,
        review_result: 'pass',
        created_at: '2024-05-01T12:00:00Z'
      },
      {
        id: '2',
        enterprise_name: '测试企业B',
        project_name: '区块链金融',
        status: 'pending_review',
        total_score: null,
        review_result: null,
        created_at: '2024-05-02T12:00:00Z'
      }
    ]
  }));
});

// 创建项目
app.post(`${API_PREFIX}/projects`, (req, res) => {
  res.json(successResponse({
    id: '3',
    ...req.body,
    status: 'pending_review',
    total_score: null,
    review_result: null,
    created_at: new Date().toISOString()
  }));
});

// 项目详情
app.get(`${API_PREFIX}/projects/:id`, (req, res) => {
  const { id } = req.params;
  res.json(successResponse({
    id,
    enterprise_name: id === '1' ? '测试企业A' : '测试企业B',
    project_name: id === '1' ? 'AI智能投研' : '区块链金融',
    description: '这是一个测试项目',
    status: id === '1' ? 'completed' : 'pending_review',
    total_score: id === '1' ? 88 : null,
    review_result: id === '1' ? 'pass' : null,
    created_at: '2024-05-01T12:00:00Z',
    updated_at: '2024-05-01T12:00:00Z',
    business_plan: {
      id: 'bp1',
      file_name: 'business_plan.pdf',
      file_size: 1024000,
      status: 'completed',
      upload_time: '2024-05-01T12:00:00Z'
    }
  }));
});

// 评分详情
app.get(`${API_PREFIX}/projects/:id/scores`, (req, res) => {
  res.json(successResponse({
    dimensions: [
      {
        dimension: '团队能力',
        score: 28,
        max_score: 30,
        comments: '团队经验丰富，分工明确',
        sub_dimensions: [
          {
            sub_dimension: '核心团队背景',
            score: 10,
            max_score: 10,
            comments: '核心成员背景优秀'
          },
          {
            sub_dimension: '团队完整性',
            score: 9,
            max_score: 10,
            comments: '团队结构完整'
          },
          {
            sub_dimension: '团队执行力',
            score: 9,
            max_score: 10,
            comments: '执行力强'
          }
        ]
      },
      {
        dimension: '产品&技术',
        score: 18,
        max_score: 20,
        comments: '技术创新性强',
        sub_dimensions: []
      },
      {
        dimension: '市场前景',
        score: 18,
        max_score: 20,
        comments: '市场空间大',
        sub_dimensions: []
      },
      {
        dimension: '商业模式',
        score: 18,
        max_score: 20,
        comments: '盈利模式不清晰，需要进一步优化',
        sub_dimensions: []
      },
      {
        dimension: '财务情况',
        score: 3,
        max_score: 10,
        comments: '财务状况良好',
        sub_dimensions: []
      }
    ]
  }));
});

// 缺失信息
app.get(`${API_PREFIX}/projects/:id/missing-information`, (req, res) => {
  res.json(successResponse({
    items: [
      {
        dimension: '财务情况',
        information_type: '财务报表',
        description: '缺少2023年财务报表',
        status: 'pending'
      }
    ]
  }));
});

// 项目评审详情
app.get(`${API_PREFIX}/projects/:id/review-details`, (req, res) => {
  const { id } = req.params;
  res.json(successResponse({
    basic_info: {
      id,
      enterprise_name: '测试企业A',
      project_name: 'AI智能投研',
      status: 'completed'
    },
    current_review: {
      total_score: 88,
      dimensions: [
        {
          dimension: '团队',
          score: 25,
          max_score: 30,
          comments: '团队经验丰富',
          sub_dimensions: [
            {
              sub_dimension: '核心团队背景',
              score: 8,
              max_score: 10,
              comments: '核心成员背景优秀'
            },
            {
              sub_dimension: '团队完整性',
              score: 9,
              max_score: 10,
              comments: '团队结构完整'
            },
            {
              sub_dimension: '团队执行力',
              score: 8,
              max_score: 10,
              comments: '团队执行力强'
            }
          ]
        }
      ],
      modified_by: 'admin',
      modified_at: '2024-05-01T12:00:00Z'
    },
    review_history: [
      {
        review_id: 'rh1',
        total_score: 85,
        dimensions: [],
        modified_by: 'admin',
        modified_at: '2024-05-01T11:00:00Z',
        modification_notes: '调整团队评分'
      }
    ],
    missing_info: [
      {
        dimension: '财务',
        information_type: '财务报表',
        description: '缺少2023年财务报表'
      }
    ]
  }));
});

// 更新项目评分
app.put(`${API_PREFIX}/projects/:id/review`, (req, res) => {
  res.json(successResponse({
    review_id: 'rh2',
    total_score: req.body.total_score,
    modified_at: new Date().toISOString()
  }));
});

// BP文档上传
app.post(`${API_PREFIX}/projects/:id/business-plans`, (req, res) => {
  res.json(successResponse({
    id: 'bp1',
    file_name: 'business_plan.pdf',
    file_size: 1024000,
    status: 'processing',
    upload_time: new Date().toISOString()
  }));
});

// BP文档处理状态
app.get(`${API_PREFIX}/projects/:id/business-plans/status`, (req, res) => {
  res.json(successResponse({
    status: 'processing',
    progress: 80,
    message: '正在解析BP文档'
  }));
});

// 获取评审报告
app.get(`${API_PREFIX}/projects/:id/reports`, (req, res) => {
  res.json(successResponse({
    report_url: '/api/v1/projects/1/reports/download',
    generated_at: '2024-05-01T12:00:00Z'
  }));
});

// 下载评审报告
app.get(`${API_PREFIX}/projects/:id/reports/download`, (req, res) => {
  const filePath = path.join(__dirname, 'mock-report.pdf');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=mock-report.pdf');
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.status(404).json(errorResponse(404, 'Report not found'));
  }
});

// 登录
app.post(`${API_PREFIX}/auth/login`, (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin') {
    res.json(successResponse({
      token: 'mock-token',
      user: {
        id: '1',
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin'
      }
    }));
  } else {
    res.status(401).json(errorResponse(401, 'Invalid credentials'));
  }
});

// WebSocket模拟
app.get(`${API_PREFIX}/ws/projects/:id/status`, (req, res) => {
  res.json(successResponse({
    status: 'processing',
    progress: 80,
    message: '正在解析BP文档'
  }));
});

app.listen(PORT, () => {
  console.log(`Mock API server running at http://localhost:${PORT}`);
}); 