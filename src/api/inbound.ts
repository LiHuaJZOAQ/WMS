import request from '../utils/request';

// 数据库表对应的接口类型
interface RawMaterialInbound {
  inboundID: number;
  inboundNumber: string;
  supplierID: number;
  warehouseID: number;
  inboundDate: string;
  operatorUserID: number;
  status: 'Draft' | 'Pending' | 'Completed' | 'Cancelled';
  totalAmount: number;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

interface RawMaterialInboundDetail {
  detailID: number;
  inboundID: number;
  rawMaterialID: number;
  quantity: number;
  unitPrice: number;
  amount: number;
  batchNumber?: string;
  productionDate?: string;
  expiryDate?: string;
  qualityStatus: 'Qualified' | 'Unqualified' | 'Pending';
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

// API请求响应类型
interface FilterOption {
  value: string;
  label: string;
}

interface MaterialOption {
  materialNo: string;
  materialName: string;
  specification: string;
  unit: string;
}

interface FilterOptions {
  orderStatus: FilterOption[];
  warehouseReceiptNos: FilterOption[];
  sourceDocNos: FilterOption[];
  materialNames: FilterOption[];
  materialNos: FilterOption[];
  batchNos: FilterOption[];
  warehouses: FilterOption[];
  warehouseTypes: FilterOption[];
  warehouseMethods: FilterOption[];
  suppliers: FilterOption[];
  manufacturers: FilterOption[];
}

interface InboundOrderQuery {
  page: number;
  pageSize: number;
  orderStatus?: string;
  warehouseReceiptNo?: string;
  sourceDocNo?: string;
  materialName?: string;
  materialNo?: string;
  batchNo?: string;
  warehouse?: string;
  warehouseType?: string;
  warehouseMethod?: string;
  supplier?: string;
  manufacturer?: string;
  startDate?: string;
  endDate?: string;
}

interface InboundOrder {
  id: number;
  warehouseReceiptNo: string;
  receivedQuantity: number;
  receivedGrossWeight: number;
  receivedNetWeight: number;
  supplierName: string;
  manufacturerName: string;
  orderDate: string;
  warehouseDate: string;
  status: string;
}

interface InboundOrderList {
  list: InboundOrder[];
  total: number;
}

interface InboundOrderDetail {
  materialNo: string;
  materialName: string;
  specification: string;
  unit: string;
  batchNo: string;
  expectedQuantity: number;
  productionDate?: string;
  expiryDate?: string;
  qualityStatus?: 'Qualified' | 'Unqualified' | 'Pending';
  unitPrice: number;
  amount: number;
  remarks?: string;
}

interface CreateInboundOrderData {
  warehouseReceiptNo: string;
  warehouseType: string;
  warehouse: string;
  warehouseMethod: string;
  supplier: string;
  manufacturer: string;
  remark?: string;
  details: InboundOrderDetail[];
  inboundDate?: string;
  totalAmount: number;
}

interface AuditData {
  ids: number[];
  status: 'approved' | 'rejected';
  reason?: string;
}

interface RevokeData {
  ids: number[];
}

interface AuditResult {
  code: number;
  message: string;
  data: {
    successCount: number;
    failCount: number;
  };
}

interface PrintData {
  id: number;
  warehouseReceiptNo: string;
  details: {
    materialName: string;
    quantity: number;
    unit: string;
    batchNo?: string;
    productionDate?: string;
  }[];
  printTime: string;
}

interface CreateOptions {
  warehouseTypes: FilterOption[];
  warehouses: FilterOption[];
  warehouseMethods: FilterOption[];
  suppliers: FilterOption[];
  manufacturers: FilterOption[];
  materials: MaterialOption[];
}

interface CreateResult {
  code: number;
  message: string;
  data: {
    id: number;
    warehouseReceiptNo: string;
    status: string;
  };
}

/**
 * 入库管理API接口
 */
const inboundApi = {
  /**
   * 1. 获取筛选选项
   * @returns {Promise<FilterOptions>} 筛选选项数据
   */
  getFilterOptions(): Promise<FilterOptions> {
    return request({
      url: '/api/inbound-orders/options',
      method: 'GET'
    });
  },

  /**
   * 2. 获取入库单列表
   * @param {InboundOrderQuery} params 查询参数
   * @returns {Promise<InboundOrderList>} 入库单列表数据
   */
  getInboundOrders(params: InboundOrderQuery): Promise<InboundOrderList> {
    return request({
      url: '/api/inbound-orders',
      method: 'GET',
      params: {
        ...params,
        startDate: params.startDate ? `${params.startDate} 00:00:00` : undefined,
        endDate: params.endDate ? `${params.endDate} 23:59:59` : undefined
      }
    });
  },

  /**
   * 3. 导出入库单
   * @param {InboundOrderQuery} params 查询参数
   * @returns {Promise<Blob>} Excel文件流
   */
  exportInboundOrders(params: InboundOrderQuery): Promise<Blob> {
    return request({
      url: '/api/inbound-orders/export',
      method: 'GET',
      params: {
        ...params,
        startDate: params.startDate ? `${params.startDate} 00:00:00` : undefined,
        endDate: params.endDate ? `${params.endDate} 23:59:59` : undefined
      },
      responseType: 'blob'
    });
  },

  /**
   * 4. 审核入库单
   * @param {AuditData} data 审核数据
   * @returns {Promise<AuditResult>} 审核结果
   */
  auditInboundOrders(data: AuditData): Promise<AuditResult> {
    return request({
      url: '/api/inbound-orders/audit',
      method: 'PUT',
      data: {
        ...data,
        status: data.status === 'approved' ? 'Completed' : 'Cancelled'
      }
    });
  },

  /**
   * 5. 撤销入库单
   * @param {RevokeData} data 撤销数据
   * @returns {Promise<AuditResult>} 撤销结果
   */
  revokeInboundOrders(data: RevokeData): Promise<AuditResult> {
    return request({
      url: '/api/inbound-orders/revoke',
      method: 'PUT',
      data
    });
  },

  /**
   * 6. 获取打印数据
   * @param {number} id 入库单ID
   * @returns {Promise<PrintData>} 打印数据
   */
  getPrintData(id: number): Promise<PrintData> {
    return request({
      url: `/api/inbound-orders/${id}/print`,
      method: 'GET'
    });
  },

  /**
   * 7. 获取新建入库单选项
   * @returns {Promise<CreateOptions>} 新建入库单选项数据
   */
  getCreateOptions(): Promise<CreateOptions> {
    return request({
      url: '/api/inbound-orders/create-options',
      method: 'GET'
    });
  },

  /**
   * 8. 创建入库单
   * @param {CreateInboundOrderData} data 入库单数据
   * @returns {Promise<CreateResult>} 创建结果
   */
  createInboundOrder(data: CreateInboundOrderData): Promise<CreateResult> {
    // 处理数据转换，匹配数据库结构
    const inboundOrder: Partial<RawMaterialInbound> = {
      inboundNumber: data.warehouseReceiptNo,
      warehouseID: parseInt(data.warehouse),
      supplierID: parseInt(data.supplier),
      inboundDate: data.inboundDate || new Date().toISOString(),
      status: 'Draft',
      totalAmount: data.totalAmount,
      remarks: data.remark
    };

    // 处理明细数据转换
    const details: Partial<RawMaterialInboundDetail>[] = data.details.map(detail => ({
      rawMaterialID: parseInt(detail.materialNo),
      quantity: detail.expectedQuantity,
      unitPrice: detail.unitPrice,
      amount: detail.amount,
      batchNumber: detail.batchNo,
      productionDate: detail.productionDate,
      expiryDate: detail.expiryDate,
      qualityStatus: detail.qualityStatus || 'Pending',
      remarks: detail.remarks
    }));

    return request({
      url: '/api/inbound-orders',
      method: 'POST',
      data: {
        inboundOrder,
        details
      }
    });
  },

  // 辅助方法
  /**
   * 批量审核入库单 - 通过
   * @param {number[]} ids 入库单ID数组
   * @returns {Promise<AuditResult>} 审核结果
   */
  batchApprove(ids: number[]): Promise<AuditResult> {
    return this.auditInboundOrders({
      ids,
      status: 'approved'
    });
  },

  /**
   * 批量审核入库单 - 拒绝
   * @param {number[]} ids 入库单ID数组
   * @param {string} reason 拒绝原因
   * @returns {Promise<AuditResult>} 审核结果
   */
  batchReject(ids: number[], reason: string): Promise<AuditResult> {
    return this.auditInboundOrders({
      ids,
      status: 'rejected',
      reason
    });
  },

  /**
   * 批量撤销入库单
   * @param {number[]} ids 入库单ID数组
   * @returns {Promise<AuditResult>} 撤销结果
   */
  batchRevoke(ids: number[]): Promise<AuditResult> {
    return this.revokeInboundOrders({ ids });
  }
};

export default inboundApi;
