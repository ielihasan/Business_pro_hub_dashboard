"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase-client";
import { resolveBusinessId } from "@/lib/resolve-business-id";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { Users, Clock, TrendingUp, CheckCircle, BarChart3, Zap, Target, Award } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface DayStat  { day: string; queues: number; completed: number; cancelled: number; revenue: number }
interface HourStat { hour: string; count: number }
interface SvcStat  { name: string; value: number; color: string }
interface Summary  { totalServed: number; avgWaitMin: number; completionRate: number; busiestHour: string; totalRevenue: number; topService: string }

const PIE_COLORS = ["#3D4127","#636B2F","#8B9340","#B4BC55","#D4DE95","#4B5563"];
const fmtDay   = (iso: string) => new Date(iso).toLocaleDateString("en-US",{ weekday:"short", month:"short", day:"numeric" });
const fmtHour  = (h: number)   => h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h-12}pm`;
const fmtMoney = (n: number)   => `Rs. ${n.toLocaleString()}`;

export default function AnalyticsPage() {
  const [businessId, setBusinessId] = useState<string|null>(null);
  const [loading,    setLoading]    = useState(true);
  const [summary,    setSummary]    = useState<Summary>({ totalServed:0, avgWaitMin:0, completionRate:0, busiestHour:"—", totalRevenue:0, topService:"—" });
  const [dayStats,   setDayStats]   = useState<DayStat[]>([]);
  const [hourStats,  setHourStats]  = useState<HourStat[]>([]);
  const [svcStats,   setSvcStats]   = useState<SvcStat[]>([]);
  const [range,      setRange]      = useState<7|14|30>(14);

  useEffect(() => { resolveBusinessId().then(id => { if (id) setBusinessId(id); }); }, []);

  const fetchAnalytics = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const since = new Date();
      since.setDate(since.getDate() - range);
      const { data: rows } = await supabase
        .from("queues")
        .select("joined_at,started_at,completed_at,status,service_type,total_price")
        .eq("business_id", businessId)
        .gte("joined_at", since.toISOString());
      if (!rows || rows.length === 0) { setLoading(false); return; }

      // Day stats
      const byDay: Record<string, DayStat> = {};
      for (let i = range - 1; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = d.toISOString().split("T")[0];
        byDay[key] = { day: fmtDay(key), queues:0, completed:0, cancelled:0, revenue:0 };
      }
      rows.forEach(r => {
        const key = (r.joined_at||"").substring(0,10);
        if (!byDay[key]) return;
        byDay[key].queues++;
        if (r.status === "completed") { byDay[key].completed++; byDay[key].revenue += parseFloat(r.total_price||"0"); }
        if (r.status === "cancelled") byDay[key].cancelled++;
      });
      setDayStats(Object.values(byDay));

      // Peak hours
      const hourMap: Record<number,number> = {};
      for (let h = 7; h <= 20; h++) hourMap[h] = 0;
      rows.forEach(r => {
        const h = new Date(r.joined_at).getHours();
        if (h >= 7 && h <= 20) hourMap[h] = (hourMap[h]||0) + 1;
      });
      setHourStats(Object.entries(hourMap).map(([h,c]) => ({ hour: fmtHour(Number(h)), count: c })));

      // Service breakdown
      const svcMap: Record<string,number> = {};
      rows.forEach(r => { const s = r.service_type||"Other"; svcMap[s]=(svcMap[s]||0)+1; });
      const svcArr = Object.entries(svcMap).sort((a,b)=>b[1]-a[1]);
      setSvcStats(svcArr.map(([name,value],i) => ({ name, value, color: PIE_COLORS[i % PIE_COLORS.length] })));

      // Summary
      const completed = rows.filter(r => r.status === "completed");
      const withTimes = completed.filter(r => r.started_at && r.completed_at);
      const avgWait   = withTimes.length
        ? withTimes.reduce((s,r) => s + (new Date(r.completed_at).getTime() - new Date(r.started_at).getTime()), 0) / withTimes.length / 60000
        : 0;
      const bestHour = Object.entries(hourMap).sort((a,b)=>b[1]-a[1])[0];
      setSummary({
        totalServed:    completed.length,
        avgWaitMin:     Math.round(avgWait),
        completionRate: Math.round((completed.length / rows.length) * 100),
        busiestHour:    bestHour ? fmtHour(Number(bestHour[0])) : "—",
        totalRevenue:   completed.reduce((s,r) => s + parseFloat(r.total_price||"0"), 0),
        topService:     svcArr[0]?.[0] || "—",
      });
    } finally { setLoading(false); }
  }, [businessId, range]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  if (loading) return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({length:4}).map((_,i)=><Skeleton key={i} className="h-28 rounded-xl"/>)}</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{Array.from({length:4}).map((_,i)=><Skeleton key={i} className="h-72 rounded-xl"/>)}</div>
    </div>
  );

  const maxHour = Math.max(...hourStats.map(h => h.count));

  return (
    <div className="space-y-8">
      {/* Header + range picker */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-1 text-gray-500">Real-time insights powered by your queue data</p>
        </div>
        <div className="flex gap-2">
          {([7,14,30] as const).map(n => (
            <button key={n} onClick={() => setRange(n)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors
                ${range===n ? "bg-[#3D4127] text-white border-[#3D4127]" : "bg-white text-gray-600 border-gray-200 hover:border-[#636B2F]"}`}>
              {n}d
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Customers Served", value:summary.totalServed.toLocaleString(), sub:"completed queues",   icon:<Users className="size-5 text-[#3D4127]"/>,      bg:"bg-[#3D4127]/10" },
          { label:"Avg Wait Time",    value:`${summary.avgWaitMin||"—"} min`,     sub:"per customer",       icon:<Clock className="size-5 text-blue-600"/>,        bg:"bg-blue-50" },
          { label:"Completion Rate",  value:`${summary.completionRate}%`,          sub:"served vs total",    icon:<CheckCircle className="size-5 text-green-600"/>, bg:"bg-green-50" },
          { label:"Total Revenue",    value:fmtMoney(summary.totalRevenue),        sub:"from queue entries", icon:<TrendingUp className="size-5 text-emerald-600"/>,bg:"bg-emerald-50" },
        ].map(c => (
          <Card key={c.label} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{c.label}</CardTitle>
              <div className={`p-2 rounded-lg ${c.bg}`}>{c.icon}</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{c.value}</div>
              <p className="text-xs text-gray-500 mt-1">{c.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI insight strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon:<Zap className="size-4 text-amber-600"/>,    bg:"bg-amber-50 border-amber-200",         label:"Busiest Hour", val:summary.busiestHour },
          { icon:<Award className="size-4 text-purple-600"/>, bg:"bg-purple-50 border-purple-200",       label:"Top Service",  val:summary.topService },
          { icon:<Target className="size-4 text-[#3D4127]"/>, bg:"bg-[#3D4127]/10 border-[#636B2F]/30", label:"Queue Health", val:summary.completionRate>=70?"🟢 Excellent":summary.completionRate>=50?"🟡 Average":"🔴 Needs Work" },
        ].map(item => (
          <div key={item.label} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${item.bg}`}>
            <div className="shrink-0">{item.icon}</div>
            <div><p className="text-xs text-gray-500">{item.label}</p><p className="text-sm font-semibold text-gray-800">{item.val}</p></div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="size-4 text-[#3D4127]"/>Queue Volume</CardTitle>
            <CardDescription>Daily totals vs completions — last {range} days</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={dayStats} margin={{left:-20,right:4}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="day" tick={{fontSize:10}} tickLine={false} interval={range>7?2:0}/>
                <YAxis tick={{fontSize:11}} tickLine={false} axisLine={false}/>
                <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
                <Legend wrapperStyle={{fontSize:12}}/>
                <Bar dataKey="queues"    name="Total"     fill="#D4DE95" radius={[4,4,0,0]}/>
                <Bar dataKey="completed" name="Completed" fill="#3D4127" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="size-4 text-emerald-600"/>Revenue Trend</CardTitle>
            <CardDescription>Daily earnings from completed queue entries</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={dayStats} margin={{left:0,right:4}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="day" tick={{fontSize:10}} tickLine={false} interval={range>7?2:0}/>
                <YAxis tick={{fontSize:11}} tickLine={false} axisLine={false}
                  tickFormatter={v => v>=1000 ? `${(v/1000).toFixed(1)}k` : String(v)}/>
                <Tooltip formatter={(v:any) => [fmtMoney(v),"Revenue"]} contentStyle={{fontSize:12,borderRadius:8}}/>
                <Line type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={2.5} dot={false} activeDot={{r:5}}/>
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Clock className="size-4 text-blue-600"/>Peak Hours</CardTitle>
            <CardDescription>Customer arrival heatmap — hour of day</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={hourStats} margin={{left:-20,right:4}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="hour" tick={{fontSize:10}} tickLine={false}/>
                <YAxis tick={{fontSize:11}} tickLine={false} axisLine={false}/>
                <Tooltip contentStyle={{fontSize:12,borderRadius:8}} formatter={(v:any)=>[v,"customers"]}/>
                <Bar dataKey="count" name="Customers" radius={[4,4,0,0]}>
                  {hourStats.map((h,i) => <Cell key={i} fill={h.count === maxHour ? "#3D4127" : "#B4BC55"}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-center text-gray-400 mt-1">Darkest bar = peak hour ({summary.busiestHour})</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Target className="size-4 text-[#3D4127]"/>Service Breakdown</CardTitle>
            <CardDescription>Queue share by service type</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {svcStats.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No service data yet</div>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="55%" height={220}>
                  <PieChart>
                    <Pie data={svcStats} cx="50%" cy="50%" innerRadius={50} outerRadius={88} dataKey="value" paddingAngle={3}>
                      {svcStats.map((s,i) => <Cell key={i} fill={s.color}/>)}
                    </Pie>
                    <Tooltip contentStyle={{fontSize:12,borderRadius:8}} formatter={(v:any)=>[v," customers"]}/>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2 min-w-0">
                  {svcStats.slice(0,6).map((s,i) => {
                    const total = svcStats.reduce((a,x) => a+x.value, 0);
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{background:s.color}}/>
                        <span className="text-xs text-gray-700 flex-1 truncate">{s.name}</span>
                        <Badge variant="outline" className="text-xs shrink-0">{Math.round(s.value/total*100)}%</Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Predictor summary */}
      <Card className="border-[#636B2F]/40 bg-gradient-to-r from-[#3D4127]/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="size-5 text-[#3D4127]"/>
            AI Wait Time Predictor
            <Badge className="bg-[#3D4127] text-white text-xs ml-1">Live</Badge>
          </CardTitle>
          <CardDescription>Self-learning from every completed queue — customers see live estimates on the join page</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label:"Avg service time", val: summary.avgWaitMin ? `${summary.avgWaitMin} min` : "—" },
              { label:"Peak demand hour", val: summary.busiestHour },
              { label:"Completion rate",  val: `${summary.completionRate}%` },
            ].map(item => (
              <div key={item.label} className="p-4 bg-white rounded-xl border text-center">
                <p className="text-3xl font-bold text-[#3D4127]">{item.val}</p>
                <p className="text-xs text-gray-500 mt-1">{item.label}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4 text-center">
            💡 Estimates update automatically — no manual tuning needed
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
