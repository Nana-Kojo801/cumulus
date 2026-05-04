// Cumulus — main app shell, router, and design canvas wrapper

const { useState: useSt, useEffect: useEf } = React;

const App = () => {
  const [route, setRoute] = useSt({ name: "home" });
  const [modal, setModal] = useSt(null);
  const semesters = SEMESTERS;
  const courses = COURSES;

  const go = (r) => { setRoute(r); setModal(null); };
  const openModal = (m) => setModal(m);
  const closeModal = () => setModal(null);

  // crumbs
  const crumbs = (() => {
    if (route.name === "home") return [{ label: "Dashboard" }];
    if (route.name === "semesters") return [{ label: "Dashboard", go: () => go({ name: "home" }) }, { label: "Semesters" }];
    if (route.name === "semester") {
      const s = semesters.find(x => x.id === route.id);
      return [
        { label: "Dashboard", go: () => go({ name: "home" }) },
        { label: "Semesters", go: () => go({ name: "semesters" }) },
        { label: s?.name || "Semester" },
      ];
    }
    if (route.name === "course") {
      const c = courses.find(x => x.id === route.id);
      const s = semesters.find(x => x.id === c?.semesterId);
      return [
        { label: "Dashboard", go: () => go({ name: "home" }) },
        { label: s?.name || "Semester", go: () => go({ name: "semester", id: s?.id }) },
        { label: c ? `${c.code} · ${c.name}` : "Course" },
      ];
    }
    if (route.name === "simulator") return [{ label: "Dashboard", go: () => go({ name: "home" }) }, { label: "GPA Simulator" }];
    if (route.name === "settings") return [{ label: "Dashboard", go: () => go({ name: "home" }) }, { label: "Settings" }];
    return [{ label: "Dashboard" }];
  })();

  const right = (
    <>
      {route.name === "home" && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 12px", height: 34, border: "1px solid var(--c-line)", borderRadius: 999, background: "var(--c-bg-2)", color: "var(--c-text-3)", fontSize: 12 }}>
            <I.Search className="c-ico sm"/> Search courses…
            <span className="c-kbd" style={{ marginLeft: 16 }}>⌘K</span>
          </div>
          <button className="c-btn ghost icon"><I.Bell className="c-ico"/></button>
        </>
      )}
      {route.name === "course" && (
        <>
          <button className="c-btn ghost sm" onClick={() => openModal({ kind: "export", courseId: route.id })}>
            <I.Share className="c-ico sm"/> Share
          </button>
          <button className="c-btn primary sm" onClick={() => openModal({ kind: "needed", courseId: route.id })}>
            <I.Target className="c-ico sm"/> What I need
          </button>
        </>
      )}
    </>
  );

  let main;
  switch (route.name) {
    case "home": main = <HomeScreen go={go} semesters={semesters} courses={courses}/>; break;
    case "semesters": main = <SemestersScreen go={go} semesters={semesters} courses={courses} openModal={openModal}/>; break;
    case "semester": main = <SemesterScreen go={go} semesterId={route.id} semesters={semesters} courses={courses} openModal={openModal}/>; break;
    case "course": main = <CourseScreen go={go} courseId={route.id} courses={courses} semesters={semesters} openModal={openModal}/>; break;
    case "simulator": main = <SimulatorScreen courses={courses} semesters={semesters}/>; break;
    case "settings": main = <SettingsScreen go={go} openModal={openModal}/>; break;
    default: main = <HomeScreen go={go} semesters={semesters} courses={courses}/>;
  }

  return (
    <div className="c-app c-shell" style={{ position: "relative" }}>
      <Sidebar route={route} go={go} semesters={semesters} courses={courses}/>
      <div className="c-main">
        <Topbar crumbs={crumbs} right={right}/>
        <div className="c-page">{main}</div>
      </div>

      {modal && (
        <div className="c-sheet-mask" onClick={closeModal}>
          <div onClick={e => e.stopPropagation()}>
            {modal.kind === "score" && <ScoreEntryModal {...modal} courses={courses} onClose={closeModal}/>}
            {modal.kind === "needed" && <NeededModal {...modal} courses={courses} onClose={closeModal}/>}
            {modal.kind === "criteria" && <CriteriaModal {...modal} courses={courses} onClose={closeModal}/>}
            {modal.kind === "export" && <ExportModal {...modal} courses={courses} onClose={closeModal}/>}
            {modal.kind === "scale" && <GradeScaleModal onClose={closeModal}/>}
            {modal.kind === "course-edit" && <CourseEditModal {...modal} courseId={modal.id} courses={courses} semesters={semesters} onClose={closeModal}/>}
          </div>
        </div>
      )}
    </div>
  );
};

window.App = App;
