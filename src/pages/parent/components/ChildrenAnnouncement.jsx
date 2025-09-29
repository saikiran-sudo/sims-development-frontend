function ChildrenAnnouncement({announcements}) {
    if(announcements.length === 0){
        return <div>No announcements</div>
    }
    return (
        <>
        <div className="">
        <div className="text-xl font-semibold mb-2 mt-3">Announcements</div>
        <div className="border-b-2 border-black-200"></div>
        <div className="w-full h-[400px] overflow-auto">
        {announcements.map((a) => (
            <div className="text-md p-3 " key={a.date}>
                <div className="text-sm font-semibold">Date: {a.date}</div>
                <div className="text-sm font-semibold">Title: {a.title}</div>
                <div className="text-sm font-semibold">Description: {a.description}</div>
                <div className="border-b-2 border-black-200"></div>
            </div>
        ))}
        </div>
        </div>
        </>
    )
}

export default ChildrenAnnouncement;