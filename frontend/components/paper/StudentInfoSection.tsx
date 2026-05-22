export function StudentInfoSection() {
  return (
    <div className="my-6 grid grid-cols-1 gap-4 sm:grid-cols-3 print:grid-cols-3">
      {['Name', 'Roll Number', 'Section / Class'].map((label) => (
        <div key={label} className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {label}
          </label>
          <div className="h-8 w-full border-b-2 border-gray-400" />
        </div>
      ))}
    </div>
  );
}
