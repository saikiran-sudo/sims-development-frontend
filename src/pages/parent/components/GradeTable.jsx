function GradeTable ({gradeData}) {
    const getRowColor = (grade) => {
        switch (grade) {
          case 'A':
            return 'bg-green-50 hover:bg-green-100';
          case 'A-':
          case 'B+':
            return 'bg-blue-50 hover:bg-blue-100';
          case 'B':
          case 'B-':
            return 'bg-purple-50 hover:bg-purple-100';
          case 'C+':
          case 'C':
            return 'bg-yellow-50 hover:bg-yellow-100';
          case 'C-':
          case 'D':
            return 'bg-orange-50 hover:bg-orange-100';
          case 'F':
            return 'bg-red-50 hover:bg-red-100';
          default:
            return 'hover:bg-gray-50';
        }
      };
    
    return(
        <>
        <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subject
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Exam
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Score
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Grade
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {gradeData.map((item) => (
              <tr key={item.id} className={`${getRowColor(item.grade)} transition-colors`}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.subject}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.exam}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.score}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    item.grade === 'A' ? 'bg-green-100 text-green-800' :
                    item.grade === 'A-' ? 'bg-blue-100 text-blue-800' :
                    item.grade === 'B+' ? 'bg-indigo-100 text-indigo-800' :
                    item.grade === 'B' ? 'bg-purple-100 text-purple-800' :
                    item.grade === 'B-' ? 'bg-violet-100 text-violet-800' :
                    item.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {item.grade}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
        </>
    )
}

export default GradeTable