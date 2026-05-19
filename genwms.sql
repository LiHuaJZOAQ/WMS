DROP DATABASE IF EXISTS wms;
CREATE DATABASE wms
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
USE wms;

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE `User` (
  `UserID` INT PRIMARY KEY AUTO_INCREMENT,
  `Username` VARCHAR(50) NOT NULL UNIQUE,
  `PasswordHash` VARCHAR(256) NOT NULL,
  `Email` VARCHAR(100) UNIQUE,
  `FullName` VARCHAR(100),
  `Phone` VARCHAR(20),
  `Department` VARCHAR(50),
  `Position` VARCHAR(50),
  `IsActive` TINYINT(1) DEFAULT 1,
  `LastLoginTime` DATETIME,
  `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `IX_User_Username` (`Username`),
  INDEX `IX_User_Email` (`Email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Role` (
  `RoleID` INT PRIMARY KEY AUTO_INCREMENT,
  `RoleName` VARCHAR(50) NOT NULL UNIQUE,
  `Description` VARCHAR(200),
  `IsSystem` TINYINT(1) DEFAULT 0,
  `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `UserRole` (
  `UserID` INT NOT NULL,
  `RoleID` INT NOT NULL,
  `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`UserID`, `RoleID`),
  FOREIGN KEY (`UserID`) REFERENCES `User`(`UserID`) ON DELETE CASCADE,
  FOREIGN KEY (`RoleID`) REFERENCES `Role`(`RoleID`) ON DELETE CASCADE,
  INDEX `IX_UserRole_RoleID` (`RoleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Permission` (
  `PermissionID` INT PRIMARY KEY AUTO_INCREMENT,
  `PermissionCode` VARCHAR(50) NOT NULL UNIQUE,
  `PermissionName` VARCHAR(100) NOT NULL,
  `ParentID` INT DEFAULT 0,
  `PermissionType` VARCHAR(20) DEFAULT 'Menu',
  `Path` VARCHAR(200),
  `Icon` VARCHAR(50),
  `SortOrder` INT DEFAULT 0,
  `Description` VARCHAR(200),
  `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `IX_Permission_Code` (`PermissionCode`),
  INDEX `IX_Permission_Parent` (`ParentID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `RolePermission` (
  `RoleID` INT NOT NULL,
  `PermissionID` INT NOT NULL,
  `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`RoleID`, `PermissionID`),
  FOREIGN KEY (`RoleID`) REFERENCES `Role`(`RoleID`) ON DELETE CASCADE,
  FOREIGN KEY (`PermissionID`) REFERENCES `Permission`(`PermissionID`) ON DELETE CASCADE,
  INDEX `IX_RolePermission_PermissionID` (`PermissionID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Partner` (
  `PartnerID` INT PRIMARY KEY AUTO_INCREMENT,
  `PartnerCode` VARCHAR(50) NOT NULL UNIQUE,
  `PartnerName` VARCHAR(100) NOT NULL,
  `Role` VARCHAR(50) NOT NULL DEFAULT 'SUPPLIER',
  `ContactPerson` VARCHAR(50),
  `ContactPhone` VARCHAR(20),
  `Address` VARCHAR(255),
  `Status` TINYINT(1) DEFAULT 1,
  `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `IX_Partner_Code` (`PartnerCode`),
  INDEX `IX_Partner_Name` (`PartnerName`),
  INDEX `IX_Partner_Role` (`Role`),
  INDEX `IX_Partner_Status` (`Status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Item` (
  `ItemID` INT PRIMARY KEY AUTO_INCREMENT,
  `ItemCode` VARCHAR(50) NOT NULL UNIQUE,
  `ItemName` VARCHAR(100) NOT NULL,
  `ItemType` VARCHAR(50) NOT NULL DEFAULT 'NORMAL',
  `Category` VARCHAR(50),
  `Unit` VARCHAR(20),
  `Specification` VARCHAR(100),
  `Attributes` JSON,
  `MinStock` DECIMAL(18,3) DEFAULT 0,
  `MaxStock` DECIMAL(18,3) DEFAULT 999999,
  `Status` TINYINT(1) DEFAULT 1,
  `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `IX_Item_Code` (`ItemCode`),
  INDEX `IX_Item_Name` (`ItemName`),
  INDEX `IX_Item_Type` (`ItemType`),
  INDEX `IX_Item_Category` (`Category`),
  INDEX `IX_Item_Status` (`Status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Warehouse` (
  `WarehouseID` INT PRIMARY KEY AUTO_INCREMENT,
  `WarehouseCode` VARCHAR(20) NOT NULL UNIQUE,
  `WarehouseName` VARCHAR(100) NOT NULL,
  `Address` VARCHAR(200),
  `ManagerName` VARCHAR(50),
  `ContactPhone` VARCHAR(20),
  `Status` TINYINT(1) DEFAULT 1,
  `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `IX_Warehouse_Code` (`WarehouseCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Location` (
  `LocationID` VARCHAR(30) PRIMARY KEY,
  `WarehouseID` INT NOT NULL,
  `LocationName` VARCHAR(50) NOT NULL,
  `LocationType` VARCHAR(20) DEFAULT 'Normal',
  `Zone` VARCHAR(10),
  `Row` VARCHAR(10),
  `Col` VARCHAR(10),
  `Level` VARCHAR(10),
  `Capacity` DECIMAL(18,3) NOT NULL DEFAULT 0,
  `CurrentOccupancy` DECIMAL(18,3) DEFAULT 0,
  `IsOccupied` TINYINT(1) DEFAULT 0,
  `Status` TINYINT(1) DEFAULT 1,
  `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`WarehouseID`) REFERENCES `Warehouse`(`WarehouseID`),
  INDEX `IX_Location_Warehouse` (`WarehouseID`),
  INDEX `IX_Location_Type` (`LocationType`),
  INDEX `IX_Location_Status` (`IsOccupied`, `Status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `InboundOrder` (
  `InboundID` INT PRIMARY KEY AUTO_INCREMENT,
  `InboundNo` VARCHAR(50) NOT NULL UNIQUE,
  `OrderType` VARCHAR(50) NOT NULL DEFAULT 'PURCHASE',
  `PartnerID` INT,
  `Status` VARCHAR(20) NOT NULL DEFAULT 'Pending',
  `CreatedBy` INT,
  `CreatedTime` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `AuditBy` INT,
  `AuditTime` DATETIME,
  `Remark` VARCHAR(255),
  FOREIGN KEY (`PartnerID`) REFERENCES `Partner`(`PartnerID`) ON DELETE SET NULL,
  FOREIGN KEY (`CreatedBy`) REFERENCES `User`(`UserID`) ON DELETE SET NULL,
  FOREIGN KEY (`AuditBy`) REFERENCES `User`(`UserID`) ON DELETE SET NULL,
  INDEX `IX_InboundOrder_Status` (`Status`),
  INDEX `IX_InboundOrder_CreatedTime` (`CreatedTime`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `InboundOrderDetail` (
  `DetailID` INT PRIMARY KEY AUTO_INCREMENT,
  `InboundID` INT NOT NULL,
  `ItemID` INT NOT NULL,
  `Quantity` DECIMAL(18,3) NOT NULL,
  `LocationCode` VARCHAR(30),
  FOREIGN KEY (`InboundID`) REFERENCES `InboundOrder`(`InboundID`) ON DELETE CASCADE,
  FOREIGN KEY (`ItemID`) REFERENCES `Item`(`ItemID`) ON DELETE RESTRICT,
  FOREIGN KEY (`LocationCode`) REFERENCES `Location`(`LocationID`) ON DELETE SET NULL,
  INDEX `IX_InboundOrderDetail_Inbound` (`InboundID`),
  INDEX `IX_InboundOrderDetail_Item` (`ItemID`),
  INDEX `IX_InboundOrderDetail_Location` (`LocationCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `OutboundOrder` (
  `OutboundID` INT PRIMARY KEY AUTO_INCREMENT,
  `OutboundNo` VARCHAR(50) NOT NULL UNIQUE,
  `OrderType` VARCHAR(50) NOT NULL DEFAULT 'SALES',
  `PartnerID` INT,
  `Status` VARCHAR(20) NOT NULL DEFAULT 'Pending',
  `CreatedBy` INT,
  `CreatedTime` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `AuditBy` INT,
  `AuditTime` DATETIME,
  `Remark` VARCHAR(255),
  FOREIGN KEY (`PartnerID`) REFERENCES `Partner`(`PartnerID`) ON DELETE SET NULL,
  FOREIGN KEY (`CreatedBy`) REFERENCES `User`(`UserID`) ON DELETE SET NULL,
  FOREIGN KEY (`AuditBy`) REFERENCES `User`(`UserID`) ON DELETE SET NULL,
  INDEX `IX_OutboundOrder_Status` (`Status`),
  INDEX `IX_OutboundOrder_CreatedTime` (`CreatedTime`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `OutboundOrderDetail` (
  `DetailID` INT PRIMARY KEY AUTO_INCREMENT,
  `OutboundID` INT NOT NULL,
  `ItemID` INT NOT NULL,
  `Quantity` DECIMAL(18,3) NOT NULL,
  `LocationCode` VARCHAR(30),
  FOREIGN KEY (`OutboundID`) REFERENCES `OutboundOrder`(`OutboundID`) ON DELETE CASCADE,
  FOREIGN KEY (`ItemID`) REFERENCES `Item`(`ItemID`) ON DELETE RESTRICT,
  FOREIGN KEY (`LocationCode`) REFERENCES `Location`(`LocationID`) ON DELETE SET NULL,
  INDEX `IX_OutboundOrderDetail_Outbound` (`OutboundID`),
  INDEX `IX_OutboundOrderDetail_Item` (`ItemID`),
  INDEX `IX_OutboundOrderDetail_Location` (`LocationCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Inventory` (
  `InventoryID` INT PRIMARY KEY AUTO_INCREMENT,
  `ItemType` VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
  `ItemID` INT NOT NULL,
  `WarehouseID` INT,
  `LocationID` VARCHAR(30) NOT NULL,
  `BatchNumber` VARCHAR(50) NOT NULL DEFAULT '',
  `CurrentQuantity` DECIMAL(18,3) NOT NULL DEFAULT 0,
  `AvailableQuantity` DECIMAL(18,3) NOT NULL DEFAULT 0,
  `ReservedQuantity` DECIMAL(18,3) NOT NULL DEFAULT 0,
  `UnitCost` DECIMAL(18,4) DEFAULT 0,
  `ProductionDate` DATE,
  `ExpiryDate` DATE,
  `LastInboundDate` DATETIME,
  `LastOutboundDate` DATETIME,
  `LastUpdatedTime` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`ItemID`) REFERENCES `Item`(`ItemID`) ON DELETE RESTRICT,
  FOREIGN KEY (`WarehouseID`) REFERENCES `Warehouse`(`WarehouseID`) ON DELETE SET NULL,
  FOREIGN KEY (`LocationID`) REFERENCES `Location`(`LocationID`) ON DELETE RESTRICT,
  UNIQUE KEY `UK_Inventory_Item_Location_Batch` (`ItemID`, `LocationID`, `BatchNumber`),
  INDEX `IX_Inventory_Item` (`ItemID`),
  INDEX `IX_Inventory_Location` (`LocationID`),
  INDEX `IX_Inventory_Batch` (`BatchNumber`),
  INDEX `IX_Inventory_LowStock` (`CurrentQuantity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `InventoryTransaction` (
  `TransactionID` INT PRIMARY KEY AUTO_INCREMENT,
  `InventoryID` INT,
  `ItemID` INT,
  `TransactionType` VARCHAR(20) NOT NULL,
  `ReferenceType` VARCHAR(30),
  `ReferenceID` INT,
  `SourceDocumentNo` VARCHAR(50),
  `QuantityBefore` DECIMAL(18,3),
  `QuantityChange` DECIMAL(18,3),
  `QuantityAfter` DECIMAL(18,3),
  `Quantity` DECIMAL(18,3),
  `RemainingQuantity` DECIMAL(18,3),
  `OperatorID` INT,
  `OperatorUserID` INT,
  `TransactionTime` DATETIME,
  `TransactionDate` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`InventoryID`) REFERENCES `Inventory`(`InventoryID`) ON DELETE SET NULL,
  FOREIGN KEY (`ItemID`) REFERENCES `Item`(`ItemID`) ON DELETE SET NULL,
  FOREIGN KEY (`OperatorID`) REFERENCES `User`(`UserID`) ON DELETE SET NULL,
  FOREIGN KEY (`OperatorUserID`) REFERENCES `User`(`UserID`) ON DELETE SET NULL,
  INDEX `IX_InventoryTransaction_Inventory` (`InventoryID`),
  INDEX `IX_InventoryTransaction_Item` (`ItemID`),
  INDEX `IX_InventoryTransaction_Type` (`TransactionType`),
  INDEX `IX_InventoryTransaction_Date` (`TransactionDate`),
  INDEX `IX_InventoryTransaction_Reference` (`ReferenceType`, `ReferenceID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DELIMITER $$
CREATE TRIGGER `trg_inventory_tx_fill` BEFORE INSERT ON `InventoryTransaction`
FOR EACH ROW
BEGIN
  IF NEW.TransactionDate IS NULL THEN
    IF NEW.TransactionTime IS NOT NULL THEN
      SET NEW.TransactionDate = NEW.TransactionTime;
    ELSE
      SET NEW.TransactionDate = NOW();
    END IF;
  END IF;

  IF NEW.QuantityChange IS NULL AND NEW.Quantity IS NOT NULL THEN
    SET NEW.QuantityChange = NEW.Quantity;
  END IF;

  IF NEW.OperatorUserID IS NULL AND NEW.OperatorID IS NOT NULL THEN
    SET NEW.OperatorUserID = NEW.OperatorID;
  END IF;
END$$
DELIMITER ;

CREATE TABLE `Stocktaking` (
  `StocktakingID` INT PRIMARY KEY AUTO_INCREMENT,
  `StocktakingNumber` VARCHAR(30) NOT NULL UNIQUE,
  `WarehouseID` INT NOT NULL,
  `StocktakingType` VARCHAR(20) NOT NULL DEFAULT 'Full',
  `StocktakingDate` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `PlanStartDate` DATE,
  `PlanEndDate` DATE,
  `ActualStartDate` DATETIME,
  `ActualEndDate` DATETIME,
  `OperatorUserID` INT NOT NULL,
  `Status` VARCHAR(20) NOT NULL DEFAULT 'Draft',
  `Remarks` VARCHAR(500),
  `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`WarehouseID`) REFERENCES `Warehouse`(`WarehouseID`),
  FOREIGN KEY (`OperatorUserID`) REFERENCES `User`(`UserID`),
  INDEX `IX_Stocktaking_Number` (`StocktakingNumber`),
  INDEX `IX_Stocktaking_Date` (`StocktakingDate`),
  INDEX `IX_Stocktaking_Warehouse` (`WarehouseID`),
  INDEX `IX_Stocktaking_Status` (`Status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `StocktakingDetail` (
  `DetailID` INT PRIMARY KEY AUTO_INCREMENT,
  `StocktakingID` INT NOT NULL,
  `ItemType` VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
  `ItemID` INT NOT NULL,
  `LocationID` VARCHAR(30) NOT NULL,
  `BatchNumber` VARCHAR(50) NOT NULL DEFAULT '',
  `SystemQuantity` DECIMAL(18,3) NOT NULL DEFAULT 0,
  `ActualQuantity` DECIMAL(18,3) NOT NULL DEFAULT 0,
  `DifferenceQuantity` DECIMAL(18,3) GENERATED ALWAYS AS (ActualQuantity - SystemQuantity) STORED,
  `UnitCost` DECIMAL(18,4) DEFAULT 0,
  `DifferenceAmount` DECIMAL(18,2) GENERATED ALWAYS AS (DifferenceQuantity * UnitCost) STORED,
  `StockStatus` VARCHAR(20) DEFAULT 'Normal',
  `CounterUserID` INT,
  `CountTime` DATETIME,
  `Remarks` VARCHAR(300),
  `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`StocktakingID`) REFERENCES `Stocktaking`(`StocktakingID`) ON DELETE CASCADE,
  FOREIGN KEY (`ItemID`) REFERENCES `Item`(`ItemID`) ON DELETE RESTRICT,
  FOREIGN KEY (`LocationID`) REFERENCES `Location`(`LocationID`),
  FOREIGN KEY (`CounterUserID`) REFERENCES `User`(`UserID`) ON DELETE SET NULL,
  INDEX `IX_StocktakingDetail_Stocktaking` (`StocktakingID`),
  INDEX `IX_StocktakingDetail_Item` (`ItemID`),
  INDEX `IX_StocktakingDetail_Location` (`LocationID`),
  INDEX `IX_StocktakingDetail_Difference` (`DifferenceQuantity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `SystemConfig` (
  `ConfigID` INT PRIMARY KEY AUTO_INCREMENT,
  `ConfigKey` VARCHAR(50) NOT NULL UNIQUE,
  `ConfigValue` TEXT,
  `ConfigType` VARCHAR(20) DEFAULT 'String',
  `Category` VARCHAR(30) DEFAULT 'System',
  `Description` VARCHAR(200),
  `IsEditable` TINYINT(1) DEFAULT 1,
  `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `IX_SystemConfig_Key` (`ConfigKey`),
  INDEX `IX_SystemConfig_Category` (`Category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `OperationLog` (
  `LogID` INT PRIMARY KEY AUTO_INCREMENT,
  `UserID` INT,
  `Username` VARCHAR(50),
  `OperationType` VARCHAR(30) NOT NULL,
  `ModuleName` VARCHAR(50),
  `FunctionName` VARCHAR(100),
  `RequestMethod` VARCHAR(10),
  `RequestUrl` VARCHAR(200),
  `RequestParams` TEXT,
  `ResponseResult` TEXT,
  `ExecutionTime` INT DEFAULT 0,
  `IPAddress` VARCHAR(50),
  `UserAgent` VARCHAR(500),
  `Status` VARCHAR(20) DEFAULT 'Success',
  `ErrorMessage` TEXT,
  `OperationTime` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`UserID`) REFERENCES `User`(`UserID`) ON DELETE SET NULL,
  INDEX `IX_OperationLog_User` (`UserID`),
  INDEX `IX_OperationLog_Type` (`OperationType`),
  INDEX `IX_OperationLog_Time` (`OperationTime`),
  INDEX `IX_OperationLog_Module` (`ModuleName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `NumberSequence` (
  `SequenceID` INT PRIMARY KEY AUTO_INCREMENT,
  `SequenceType` VARCHAR(30) NOT NULL UNIQUE,
  `Prefix` VARCHAR(10) NOT NULL,
  `CurrentNumber` INT NOT NULL DEFAULT 0,
  `NumberLength` INT DEFAULT 6,
  `DateFormat` VARCHAR(20) DEFAULT 'YYYYMMDD',
  `ResetType` VARCHAR(10) DEFAULT 'Daily',
  `LastResetDate` DATE,
  `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `IX_NumberSequence_Type` (`SequenceType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `WaveDetail`;
DROP TABLE IF EXISTS `Wave`;

CREATE TABLE `Wave` (
  `WaveID` INT NOT NULL AUTO_INCREMENT,
  `WaveNo` VARCHAR(50) NOT NULL,
  `Status` VARCHAR(20) NOT NULL DEFAULT 'Pending',
  `CreatedBy` INT DEFAULT NULL,
  `CreatedTime` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `CompletedTime` DATETIME DEFAULT NULL,
  `Remark` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`WaveID`),
  UNIQUE KEY `WaveNo_UNIQUE` (`WaveNo`),
  KEY `fk_Wave_User1_idx` (`CreatedBy`),
  CONSTRAINT `fk_Wave_User1` FOREIGN KEY (`CreatedBy`) REFERENCES `User` (`UserID`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `WaveDetail` (
  `WaveDetailID` INT NOT NULL AUTO_INCREMENT,
  `WaveID` INT NOT NULL,
  `OutboundID` INT NOT NULL,
  `Status` VARCHAR(20) NOT NULL DEFAULT 'Pending',
  `PickedTime` DATETIME DEFAULT NULL,
  PRIMARY KEY (`WaveDetailID`),
  KEY `fk_WaveDetail_Wave1_idx` (`WaveID`),
  KEY `fk_WaveDetail_Outbound1_idx` (`OutboundID`),
  CONSTRAINT `fk_WaveDetail_Wave1` FOREIGN KEY (`WaveID`) REFERENCES `Wave` (`WaveID`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_WaveDetail_Outbound1` FOREIGN KEY (`OutboundID`) REFERENCES `OutboundOrder` (`OutboundID`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO `User` (`UserID`, `Username`, `PasswordHash`, `Email`, `FullName`, `Phone`, `Department`, `Position`, `IsActive`)
VALUES
  (1, 'admin', '$2b$10$H7bkIm2QyJ6GNCWQbD4w1uWDffUssdUf8aBCXmdhuk8utrt58etP2', 'admin@genwms.local', '系统管理员', '13600136001', 'IT', '管理员', 1),
  (2, 'warehouse01', '$2b$10$wNtlFy8XnFnwSzRMJ0Ohwee4K0ylxrdLmcfta44aNLOUv67JVuxGK', 'wh01@genwms.local', '张仓管', '13600136002', '仓储', '仓库管理员', 1),
  (3, 'sales01', '$2b$10$79MDqbp9jxrPfFM5o1wime80Y1O3tUU7s5ZmDSKMhcij/D.cSJfDe', 'sales01@genwms.local', '赵销售', '13600136005', '销售', '销售员', 1),
  (4, 'purchase01', '$2b$10$dW72A6Ciu.S2Y6Ef7TqmcedqqealYZT/2RwrLaIbLrGoFKKKgoeE2', 'pur01@genwms.local', '王采购', '13600136004', '采购', '采购员', 1);

INSERT INTO `Role` (`RoleID`, `RoleName`, `Description`, `IsSystem`) VALUES
  (1, '系统管理员', '系统最高权限管理员', 1),
  (2, '仓库管理员', '仓库管理权限', 0),
  (3, '采购员', '采购相关权限', 0),
  (4, '销售员', '销售相关权限', 0);

INSERT INTO `UserRole` (`UserID`, `RoleID`) VALUES
  (1, 1),
  (2, 2),
  (3, 4),
  (4, 3);

INSERT INTO `Permission` (`PermissionID`, `PermissionCode`, `PermissionName`, `ParentID`, `PermissionType`, `Path`, `Icon`, `SortOrder`) VALUES
  (1, 'SYSTEM', '系统管理', 0, 'Menu', '/system', 'system', 1),
  (2, 'BASIC', '基础数据', 0, 'Menu', '/basicData', 'dataset', 2),
  (3, 'INVENTORY', '库存管理', 0, 'Menu', '/inventory', 'inventory', 3),
  (4, 'INBOUND', '入库管理', 0, 'Menu', '/inStorage', 'inbound', 4),
  (5, 'OUTBOUND', '出库管理', 0, 'Menu', '/outStorage', 'outbound', 5),
  (6, 'STOCKTAKING', '盘点管理', 0, 'Menu', '/checkStorage', 'check', 6),
  (7, 'WAVE', '波次拣货', 0, 'Menu', '/outStorage/wavePicking', 'route', 7);

INSERT INTO `RolePermission` (`RoleID`, `PermissionID`) VALUES
  (1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7),
  (2, 2), (2, 3), (2, 4), (2, 5), (2, 6), (2, 7),
  (3, 2), (3, 4),
  (4, 2), (4, 5);

INSERT INTO `Partner` (`PartnerID`, `PartnerCode`, `PartnerName`, `Role`, `ContactPerson`, `ContactPhone`, `Address`, `Status`) VALUES
  (1, 'SUP001', '通用供应商 A', 'SUPPLIER', '张三', '13800138001', '北京市朝阳区', 1),
  (2, 'CUS001', '通用客户 A', 'CUSTOMER', '李四', '13900139001', '上海市浦东新区', 1);

INSERT INTO `Item` (`ItemID`, `ItemCode`, `ItemName`, `ItemType`, `Category`, `Unit`, `Specification`, `Attributes`, `MinStock`, `MaxStock`, `Status`) VALUES
  (1, 'SKU-RAW-001', 'PP 塑料颗粒', 'RAW', '塑料原料', 'KG', '食品级PP', JSON_OBJECT('grade','food'), 500, 5000, 1),
  (2, 'SKU-FIN-001', '经典塑料水杯 350ml', 'FINISHED', '塑料杯', 'PCS', '350ml', JSON_OBJECT('capacity','350ml','color','transparent'), 100, 1000, 1),
  (3, 'SKU-PKG-001', '彩印包装盒', 'PACKAGING', '包材', 'PCS', '纸盒', JSON_OBJECT('size','standard'), 2000, 50000, 1);

INSERT INTO `Warehouse` (`WarehouseID`, `WarehouseCode`, `WarehouseName`, `Address`, `ManagerName`, `ContactPhone`, `Status`) VALUES
  (1, 'WH001', '主仓', '示例地址', '张仓管', '18800188001', 1);

INSERT INTO `Location` (`LocationID`, `WarehouseID`, `LocationName`, `LocationType`, `Zone`, `Row`, `Col`, `Level`, `Capacity`, `CurrentOccupancy`, `IsOccupied`, `Status`) VALUES
  ('DEFAULT', 1, '默认库位', 'Normal', 'D', '00', '00', '00', 999999, 0, 0, 1),
  ('WH001-A01-R01-C01-L01', 1, 'A区01排01列01层', 'Raw', 'A', '01', '01', '01', 10000, 0, 0, 1),
  ('WH001-B01-R01-C01-L01', 1, 'B区01排01列01层', 'Finished', 'B', '01', '01', '01', 10000, 0, 0, 1);

INSERT INTO `Inventory` (`InventoryID`, `ItemType`, `ItemID`, `WarehouseID`, `LocationID`, `BatchNumber`, `CurrentQuantity`, `AvailableQuantity`, `ReservedQuantity`, `UnitCost`, `ProductionDate`, `ExpiryDate`, `LastInboundDate`, `LastOutboundDate`) VALUES
  (1, 'RAW', 1, 1, 'WH001-A01-R01-C01-L01', 'BATCH-RAW-20250616-001', 1000, 1000, 0, 15.0000, '2025-06-10', '2027-06-10', '2025-06-16 09:00:00', NULL),
  (2, 'FINISHED', 2, 1, 'WH001-B01-R01-C01-L01', 'BATCH-FIN-20250616-001', 300, 200, 100, 12.5000, '2025-06-16', NULL, '2025-06-16 10:00:00', '2025-06-16 14:00:00'),
  (3, 'PACKAGING', 3, 1, 'DEFAULT', 'BATCH-PKG-20250616-001', 5000, 5000, 0, 2.0000, '2025-06-14', NULL, '2025-06-16 08:00:00', NULL);

INSERT INTO `InboundOrder` (`InboundID`, `InboundNo`, `OrderType`, `PartnerID`, `Status`, `CreatedBy`, `CreatedTime`, `AuditBy`, `AuditTime`, `Remark`) VALUES
  (1, 'IN202506160001', 'PURCHASE', 1, 'Completed', 4, '2025-06-16 09:00:00', 2, '2025-06-16 09:30:00', '采购入库示例');

INSERT INTO `InboundOrderDetail` (`DetailID`, `InboundID`, `ItemID`, `Quantity`, `LocationCode`) VALUES
  (1, 1, 1, 1000.000, 'WH001-A01-R01-C01-L01');

INSERT INTO `OutboundOrder` (`OutboundID`, `OutboundNo`, `OrderType`, `PartnerID`, `Status`, `CreatedBy`, `CreatedTime`, `AuditBy`, `AuditTime`, `Remark`) VALUES
  (1, 'OUT202506160001', 'SALES', 2, 'approved', 3, '2025-06-16 13:00:00', 2, '2025-06-16 13:10:00', '销售出库示例（已预留）');

INSERT INTO `OutboundOrderDetail` (`DetailID`, `OutboundID`, `ItemID`, `Quantity`, `LocationCode`) VALUES
  (1, 1, 2, 100.000, 'WH001-B01-R01-C01-L01');

INSERT INTO `Wave` (`WaveID`, `WaveNo`, `Status`, `CreatedBy`, `CreatedTime`, `Remark`) VALUES
  (1, 'WV202506160001', 'Pending', 2, '2025-06-16 13:30:00', '示例波次');

INSERT INTO `WaveDetail` (`WaveDetailID`, `WaveID`, `OutboundID`, `Status`) VALUES
  (1, 1, 1, 'Pending');

INSERT INTO `Stocktaking` (`StocktakingID`, `StocktakingNumber`, `WarehouseID`, `StocktakingType`, `StocktakingDate`, `PlanStartDate`, `PlanEndDate`, `OperatorUserID`, `Status`, `Remarks`) VALUES
  (50001, 'ST202506160001', 1, 'Partial', '2025-06-16 16:00:00', '2025-06-16', '2025-06-16', 2, 'InProgress', '示例盘点');

INSERT INTO `StocktakingDetail` (`DetailID`, `StocktakingID`, `ItemType`, `ItemID`, `LocationID`, `BatchNumber`, `SystemQuantity`, `ActualQuantity`, `UnitCost`, `StockStatus`, `CounterUserID`, `CountTime`, `Remarks`) VALUES
  (1, 50001, 'FINISHED', 2, 'WH001-B01-R01-C01-L01', 'BATCH-FIN-20250616-001', 300.000, 299.000, 12.5000, 'Normal', 2, '2025-06-16 16:30:00', '示例差异');

INSERT INTO `InventoryTransaction` (`TransactionID`, `InventoryID`, `ItemID`, `TransactionType`, `ReferenceType`, `ReferenceID`, `SourceDocumentNo`, `QuantityBefore`, `QuantityChange`, `QuantityAfter`, `OperatorUserID`, `TransactionDate`, `Remarks`)
VALUES
  (1, 1, 1, 'INBOUND', 'InboundOrder', 1, 'IN202506160001', 0.000, 1000.000, 1000.000, 2, '2025-06-16 09:30:00', NULL),
  (2, 2, 2, 'OUTBOUND', 'OutboundOrder', 1, 'OUT202506160001', 300.000, -100.000, 200.000, 2, '2025-06-16 13:10:00', NULL),
  (3, 2, 2, 'Stocktaking', 'Stocktaking', 50001, 'ST202506160001', 300.000, -1.000, 299.000, 2, '2025-06-16 16:30:00', NULL);

INSERT INTO `SystemConfig` (`ConfigKey`, `ConfigValue`, `ConfigType`, `Category`, `Description`, `IsEditable`) VALUES
  ('SYSTEM_NAME', 'GenWMS', 'String', 'System', '系统名称', 1),
  ('MIN_STOCK_WARNING', 'true', 'Boolean', 'Inventory', '最小库存预警', 1);

INSERT INTO `NumberSequence` (`SequenceType`, `Prefix`, `CurrentNumber`, `NumberLength`, `DateFormat`, `ResetType`, `LastResetDate`) VALUES
  ('Inbound', 'IN', 1, 6, 'YYYYMMDD', 'Daily', '2025-06-16'),
  ('Outbound', 'OUT', 1, 6, 'YYYYMMDD', 'Daily', '2025-06-16'),
  ('Wave', 'WV', 1, 6, 'YYYYMMDD', 'Daily', '2025-06-16'),
  ('Stocktaking', 'ST', 1, 6, 'YYYYMMDD', 'Daily', '2025-06-16');

INSERT INTO `OperationLog` (`UserID`, `Username`, `OperationType`, `ModuleName`, `FunctionName`, `RequestMethod`, `RequestUrl`, `RequestParams`, `ResponseResult`, `ExecutionTime`, `IPAddress`, `UserAgent`, `Status`, `OperationTime`) VALUES
  (1, 'admin', 'Login', 'System', '用户登录', 'POST', '/api/users/login', '{"username":"admin"}', '{"message":"登录成功"}', 120, '127.0.0.1', 'Local', 'Success', '2025-06-16 08:00:00'),
  (2, 'warehouse01', 'Create', 'Inbound', '创建入库单', 'POST', '/api/inbound-orders', '{"InboundNo":"IN202506160001"}', '{"success":true}', 240, '127.0.0.1', 'Local', 'Success', '2025-06-16 09:00:00');

