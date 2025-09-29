
import UserCard from "./UserCard"
import GradeTable from "./GradeTable"
import UpcomingAssignments from "./UpcomingAssignments"
import ChildrenAnnouncement from "./ChildrenAnnouncement"

export default function ChildrenDetail({selectedChild,totalDays,presentDays,absentDays,gradeData,assignments,announcements}){



  return (
    <>
    <div>
      <div className="text-md mb-2">{selectedChild.name} ({selectedChild.studentId})</div>
      <div className="text-xl font-semibold mb-2">Attendace Summary</div>
      <div className="border-b-2 border-black-200 mb-2"></div>
      <div className="flex gap-4 justify-between flex-wrap">
        <UserCard type="Total days" value={totalDays} />
        <UserCard type="Present" value={presentDays} />
        <UserCard type="Absent" value={absentDays} />
      </div>
      <div className="text-xl font-semibold mb-2 mt-3">Latest Results</div>
      <div className="border-b-2 border-black-200"></div>
      <GradeTable gradeData={gradeData} />
      <UpcomingAssignments assignments={assignments} />
      <ChildrenAnnouncement announcements={announcements} />
    </div>
    </>
  )
}