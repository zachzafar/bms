"use client"



export default function SystemAdminHome() {


  // useEffect(() => {
  //   // Redirect to admin login
  //   router.push('/login');
  // }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl font-bold text-white">A</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">System Admin</h1>
        <p className="text-slate-300">Redirecting to login...</p>
      </div>
    </div>
  );
}
