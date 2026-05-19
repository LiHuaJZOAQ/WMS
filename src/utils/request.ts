import axios from "axios";
import querystring from "querystring";
import { ElMessage } from "element-plus";
import router from "../router"; // 引入路由实例以便跳转

const errorHandler = (status: number, info: any) => {
  let message = "发生未知错误";
  
  if (info && info.message) {
    message = info.message;
  } else {
    switch (status) {
      case 400:
        message = "请求参数或语义有误";
        break;
      case 401:
        message = "认证失败，请重新登录";
        break;
      case 403:
        message = "拒绝访问：权限不足";
        break;
      case 404:
        message = "请求错误，未找到该资源";
        break;
      case 405:
        message = "请求方法未允许";
        break;
      case 408:
        message = "请求超时";
        break;
      case 500:
        message = "服务器内部错误";
        break;
      case 502:
        message = "网关错误";
        break;
      case 503:
        message = "服务暂时不可用";
        break;
      case 504:
        message = "网络超时";
        break;
      default:
        message = `请求错误 (${status})`;
    }
  }

  // 使用 Element Plus 全局提示
  ElMessage.error(message);

  // 401 特殊处理：清除 token 并跳转登录页
  if (status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    router.push('/login');
  }
};

const service = axios.create({
  baseURL: "/api",
  timeout: 10000, // 稍微延长超时时间，适应复杂业务
});

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 从 localStorage 获取 token 并添加到请求头
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    if (config.method === "post" || config.method === "put") {
      if (config.headers["Content-Type"] === "application/x-www-form-urlencoded") {
        config.data = querystring.stringify(config.data);
      } 
      // 默认已经是 json，axios 会自动 stringify，无需手动处理
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    // 后端如果规范返回了业务状态码，可在此处统一拦截
    // 例如：我们的后端返回的是 { code: 200, message: "xxx", data: {...} }
    const res = response.data;
    
    // 如果返回的确实是包含 code 的标准格式，且 code 不是 200，则当做错误处理
    if (res && res.code && res.code !== 200) {
      ElMessage.error(res.message || '系统业务错误');
      return Promise.reject(new Error(res.message || 'Error'));
    }

    // 状态码 200，直接返回 response 保持对原有代码的兼容性
    return response;
  },
  (error) => {
    const { response } = error;
    if (response) {
      errorHandler(response.status, response.data);
      return Promise.reject(error);
    } else {
      ElMessage.error("网络错误，请检查后端服务是否启动");
      return Promise.reject(new Error("网络错误"));
    }
  }
);

export default service;
