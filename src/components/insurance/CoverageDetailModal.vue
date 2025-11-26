<template>
  <div v-if="isOpen" class="modal-overlay" @click="handleClose">
    <div class="modal-container" @click.stop>
      <!-- 헤더 -->
      <div class="modal-header">
        <h2>📋 보장내용 상세</h2>
        <button class="close-button" @click="handleClose">✕</button>
      </div>

      <!-- 본문 -->
      <div class="modal-body">
        <!-- 기본계약 -->
        <section class="coverage-section">
          <div class="section-header basic-contract">
            <h3>기본계약</h3>
            <span class="plan-badge">{{ coverageData.basic_contract.plan_type }}</span>
          </div>
          <div class="coverage-table">
            <table>
              <thead>
                <tr>
                  <th class="col-name">보장명</th>
                  <th class="col-description">보장내용</th>
                  <th class="col-amount">보험가입금액</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(coverage, index) in coverageData.basic_contract.coverages" :key="index">
                  <td class="col-name">{{ coverage.name }}</td>
                  <td class="col-description">{{ coverage.description }}</td>
                  <td class="col-amount">{{ formatAmount(coverage.amount) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- 선택특약 -->
        <section class="coverage-section">
          <div class="section-header optional-riders">
            <h3>선택특약</h3>
          </div>

          <div v-for="(rider, riderIndex) in coverageData.optional_riders" :key="riderIndex" class="rider-category">
            <h4 class="category-title">
              <span class="category-icon">📌</span>
              {{ rider.category }}
            </h4>
            <div class="coverage-table">
              <table>
                <thead>
                  <tr>
                    <th class="col-name">보장명</th>
                    <th class="col-description">보장내용</th>
                    <th class="col-amount">보험가입금액</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(coverage, index) in rider.coverages" :key="index">
                    <td class="col-name">{{ coverage.name }}</td>
                    <td class="col-description">{{ coverage.description || '-' }}</td>
                    <td class="col-amount">{{ formatAmount(coverage.amount) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- 유의사항 -->
        <section class="notes-section">
          <div class="notes-header">
            <h3>⚠️ 유의사항</h3>
          </div>
          <ul class="notes-list">
            <li v-for="(note, index) in coverageData.notes.key_points" :key="index">
              {{ note }}
            </li>
          </ul>
        </section>
      </div>

      <!-- 푸터 -->
      <div class="modal-footer">
        <div class="footer-buttons">
          <button class="pdf-btn terms-btn" @click="openTermsPdf">
            📄 약관 보기
          </button>
          <button class="pdf-btn summary-btn" @click="openSummaryPdf">
            📋 상품요약서 보기
          </button>
        </div>
        <button class="close-btn" @click="handleClose">닫기</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { COVERAGE_DETAILS_INFO } from '../../data/mockCoverageDetailData.js'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close'])

const coverageData = COVERAGE_DETAILS_INFO

const handleClose = () => {
  emit('close')
}

const openTermsPdf = () => {
  window.open('https://www.acedirect.co.kr/jsp/pdf/2020/DirectaOTA_P.pdf', '_blank', 'noopener,noreferrer')
}

const openSummaryPdf = () => {
  window.open('https://www.acedirect.co.kr/jsp/pdf/2020/DirectaOTA_S.pdf', '_blank', 'noopener,noreferrer')
}

const formatAmount = (amount) => {
  const numAmount = parseInt(amount.replace(/,/g, ''))

  if (numAmount >= 100000000) {
    return `${(numAmount / 100000000).toFixed(numAmount % 100000000 === 0 ? 0 : 1)}억원`
  } else if (numAmount >= 10000000) {
    const eok = Math.floor(numAmount / 100000000)
    const man = Math.floor((numAmount % 100000000) / 10000)
    if (eok > 0 && man > 0) {
      return `${eok}억 ${man}만원`
    } else if (eok > 0) {
      return `${eok}억원`
    } else {
      return `${man}만원`
    }
  } else if (numAmount >= 10000) {
    return `${(numAmount / 10000).toFixed(numAmount % 10000 === 0 ? 0 : 1)}만원`
  } else {
    return `${numAmount.toLocaleString()}원`
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
  padding: 20px;
  overflow-y: auto;
}

.modal-container {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 1000px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalSlideUp 0.3s ease-out;
}

@keyframes modalSlideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  border-bottom: 2px solid #f0f0f0;
  flex-shrink: 0;
}

.modal-header h2 {
  margin: 0;
  font-size: 24px;
  color: #333;
  font-weight: 700;
}

.close-button {
  width: 36px;
  height: 36px;
  border: none;
  background: #f5f5f5;
  border-radius: 50%;
  font-size: 20px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover {
  background: #fee;
  color: #f44;
  transform: rotate(90deg);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
}

.coverage-section {
  margin-bottom: 40px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding: 16px 20px;
  border-radius: 12px;
}

.section-header.basic-contract {
  background: linear-gradient(135deg, #4DBFC8 0%, #3AA8B1 100%);
  color: white;
}

.section-header.optional-riders {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.section-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}

.plan-badge {
  padding: 6px 16px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  backdrop-filter: blur(10px);
}

.rider-category {
  margin-bottom: 32px;
}

.category-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px;
  font-size: 18px;
  color: #333;
  font-weight: 600;
}

.category-icon {
  font-size: 20px;
}

.coverage-table {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #f8f9fa;
}

th {
  padding: 16px 20px;
  text-align: left;
  font-size: 14px;
  font-weight: 600;
  color: #666;
  border-bottom: 2px solid #e0e0e0;
}

.col-name {
  width: 25%;
}

.col-description {
  width: 50%;
}

.col-amount {
  width: 25%;
  text-align: right;
}

tbody tr {
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s;
}

tbody tr:hover {
  background: #f8f9fa;
}

tbody tr:last-child {
  border-bottom: none;
}

td {
  padding: 16px 20px;
  font-size: 14px;
  color: #333;
}

td.col-name {
  font-weight: 600;
  color: #4DBFC8;
}

td.col-description {
  color: #666;
  line-height: 1.5;
  word-break: keep-all;
  overflow-wrap: break-word;
}

td.col-amount {
  text-align: right;
  font-weight: 700;
  color: #333;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
}

.notes-section {
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  border-radius: 16px;
  padding: 24px;
  border-left: 4px solid #ff9800;
}

.notes-header {
  margin-bottom: 16px;
}

.notes-header h3 {
  margin: 0;
  font-size: 18px;
  color: #e65100;
  font-weight: 700;
}

.notes-list {
  margin: 0;
  padding-left: 20px;
  list-style: none;
}

.notes-list li {
  position: relative;
  padding: 8px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.notes-list li::before {
  content: '•';
  position: absolute;
  left: -20px;
  color: #ff9800;
  font-size: 20px;
  font-weight: bold;
}

.modal-footer {
  padding: 20px 32px;
  border-top: 2px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  gap: 16px;
  flex-wrap: wrap;
}

.footer-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.pdf-btn {
  padding: 10px 20px;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.pdf-btn:hover {
  border-color: #4DBFC8;
  background: #f8fffe;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(77, 191, 200, 0.2);
}

.terms-btn {
  color: #667eea;
}

.terms-btn:hover {
  border-color: #667eea;
  background: #f5f6ff;
}

.summary-btn {
  color: #F5576C;
}

.summary-btn:hover {
  border-color: #F5576C;
  background: #fff5f7;
}

.close-btn {
  padding: 12px 32px;
  background: linear-gradient(135deg, #4DBFC8 0%, #3AA8B1 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(77, 191, 200, 0.3);
}

/* 모바일 반응형 */
@media (max-width: 768px) {
  .modal-container {
    max-width: 100%;
    border-radius: 16px;
    max-height: 95vh;
  }

  .modal-header {
    padding: 20px 20px;
  }

  .modal-header h2 {
    font-size: 20px;
  }

  .modal-body {
    padding: 20px;
  }

  .section-header h3 {
    font-size: 18px;
  }

  .category-title {
    font-size: 16px;
  }

  .coverage-table {
    overflow-x: auto;
  }

  table {
    min-width: 600px;
  }

  th, td {
    padding: 12px 16px;
    font-size: 13px;
  }

  .notes-section {
    padding: 20px;
  }

  .notes-list li {
    font-size: 13px;
  }

  .modal-footer {
    padding: 16px 20px;
    flex-direction: column;
    align-items: stretch;
  }

  .footer-buttons {
    width: 100%;
    flex-direction: column;
  }

  .pdf-btn {
    width: 100%;
    justify-content: center;
    padding: 12px 20px;
  }

  .close-btn {
    width: 100%;
  }
}
</style>
