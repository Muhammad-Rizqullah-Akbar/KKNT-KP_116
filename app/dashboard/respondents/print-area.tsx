'use client'

import type { Respondent } from './types'

type PrintAreaProps = {
  filteredData: Respondent[]
  selectedGroups: string[]
  selectedForms: string[]
}

export default function PrintArea({ filteredData, selectedGroups, selectedForms }: PrintAreaProps) {
  return (
    <div id="print-area" className="hidden">
      <div className="print-header">
        <h1>Ringkasan Data Responden</h1>
        <p>Filter Group: {selectedGroups.length > 0 ? selectedGroups.join(', ') : 'Semua'}</p>
        <p>Filter Formulir: {selectedForms.length > 0 ? selectedForms.join(', ') : 'Semua'}</p>
        <p>
          Tanggal Cetak:{' '}
          {new Date().toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
        <p>Total Responden: {filteredData.length}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>No</th>
            <th>Nama</th>
            <th>Formulir</th>
            <th>Group</th>
            <th>Tanggal</th>
            <th>Skor</th>
            <th>Metrik</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((r, i) => (
            <tr key={r.id}>
              <td>{i + 1}</td>
              <td>{r.respondentName || 'Responden'}</td>
              <td>{r.formTitle}</td>
              <td>{r.groupName || '-'}</td>
              <td>{r.date}</td>
              <td>{r.score}%</td>
              <td>{r.metric}</td>
              <td>{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ marginTop: 20, fontSize: 12, color: '#999' }}>Dicetak dari Sistem KKNT-KP UH</p>
    </div>
  )
}
