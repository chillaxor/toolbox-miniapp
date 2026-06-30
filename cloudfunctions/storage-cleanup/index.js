/**
 * 统一存储清理云函数
 * 定时清理所有云函数在昨天之前产生的云存储文件和数据库 usage 记录
 * 由定时触发器每天凌晨 3 点调用
 */

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

// 清理配置：集合名 → 清理类型 + fileID 字段名
const CLEANUP_COLLECTIONS = [
  { name: 'pdf2img_usage',  type: 'storage', fileField: 'fileIDs' },  // fileIDs 是数组
  { name: 'pdf2word_usage', type: 'storage', fileField: 'fileID' },   // fileID 是单个字符串
  { name: 'idphoto_usage',  type: 'db_only' },
  { name: 'paperclean_usage',       type: 'db_only' },
  { name: 'watermarkremove_usage',  type: 'db_only' }
];

exports.main = async (event, context) => {
  const action = event.action || 'cleanup';

  if (action !== 'cleanup') {
    return { success: false, errorCode: 'INVALID_ACTION', errorMsg: '未知操作' };
  }

  // 计算"昨天之前"的时间戳：昨天 23:59:59
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(23, 59, 59, 999);
  const expireTimestamp = yesterday.getTime();

  const summary = {};

  for (const config of CLEANUP_COLLECTIONS) {
    const deletedFiles = 0;
    const deletedRecords = 0;
    const errors = 0;

    try {
      // 分批查询过期记录（每次最多 100 条，循环直到清完）
      let hasMore = true;
      let batchDeletedFiles = 0;
      let batchDeletedRecords = 0;
      let batchErrors = 0;

      while (hasMore) {
        const res = await db.collection(config.name)
          .where({ timestamp: db.command.lte(expireTimestamp) })
          .limit(100)
          .get();

        const records = res.data || [];
        if (records.length === 0) {
          hasMore = false;
          break;
        }

        for (const record of records) {
          // 删除云存储文件（如果有）
          if (config.type === 'storage' && config.fileField) {
            const fileIds = record[config.fileField];
            if (fileIds) {
              // fileIDs 可能是数组或单个字符串
              const idsToDelete = Array.isArray(fileIds) ? fileIds : [fileIds];
              for (const fileId of idsToDelete) {
                if (!fileId) continue;
                try {
                  await cloud.deleteFile({ fileList: [fileId] });
                  batchDeletedFiles++;
                } catch (e) {
                  batchErrors++;
                }
              }
            }
          }

          // 删除数据库记录
          try {
            await db.collection(config.name).doc(record._id).remove();
            batchDeletedRecords++;
          } catch (e) {
            batchErrors++;
          }
        }

        // 如果这批不到 100 条，说明已经查完了
        if (records.length < 100) {
          hasMore = false;
        }
      }

      summary[config.name] = {
        deletedFiles: batchDeletedFiles,
        deletedRecords: batchDeletedRecords,
        errors: batchErrors
      };

    } catch (e) {
      summary[config.name] = {
        deletedFiles: 0,
        deletedRecords: 0,
        errors: 1,
        message: e.message
      };
    }
  }

  return {
    success: true,
    action: 'cleanup',
    summary: summary,
    expireBefore: expireTimestamp
  };
};
