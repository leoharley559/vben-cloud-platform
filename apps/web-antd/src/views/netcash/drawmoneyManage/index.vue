<!-- eslint-disable -->
<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Page } from '@vben/common-ui';
import {
  Button, Card, Checkbox, DatePicker, Descriptions, Form, Input, InputNumber,
  Modal, Radio, Result, Select, Space, Statistic, Switch, Tabs, message,
} from 'ant-design-vue';
import dayjs from 'dayjs';
import {
  addDrawmoneyBlackApi, deleteDrawmoneyAccountApi, drawmoneyRequest,
  editDrawmoneyBlackApi, fetchDrawingsChannelSettingListApi,
  exportDrawmoneyListApi, fetchDrawmoneyBlacklistApi, fetchDrawmoneyListApi,
  orderOperateApi,
} from '#/api/netcash/drawmoney-manage';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import PassPopup from '#/components/security/pass-popup.vue';
import AgencyAccountLink from '#/components/global/agency-account-link.vue';
import { resolveAgencyAdminId } from '#/utils/agency-detail-route';
import { formatNetcashDateTime } from '#/utils/netcash';

defineOptions({ name: 'DrawmoneyManage' });
const { checkPermission, projectConfig } = useCloudPermission();
const router = useRouter();
const active = ref('');
const money = (v: unknown) => (Number(v || 0) / 100).toFixed(2);
const dt = (v: unknown) => formatNetcashDateTime(v as string);
const formatDuration=(v:unknown)=>{const n=Number(v||0),h=Math.floor(n/3600),m=Math.floor(n%3600/60),s=n%60;return n?[h,m,s].map(x=>String(x).padStart(2,'0')).join(':'):'-';};
const payType: Record<number, string> = { 1:'银行卡',2:'支付宝',3:'USDT',4:'极速支付',204:'银行卡',206:'支付宝',209:'USDT' };
function withdrawStatus(row: Record<string, unknown>) {
  const s=Number(row.Status), p=Number(row.Process), refund=Number(row.RefundScore);
  if (s===1 && p<=4) return '待处理';
  if (s===1 && p===5) return '待转回';
  if (s===1 && p===6) return '出款异常';
  if ([2,4].includes(s) && p===7) return '已出款';
  if (s===3 && p===8) return refund===1?'退款驳回':'不退款驳回';
  return '处理中';
}
const tabs = computed(() => [
  { key:'drawings', label:'提款列表', permission:10156 },
  { key:'black', label:'提款黑名单', permission:10157 },
  { key:'channel', label:'提款通道管理', permission:11696 },
  { key:'third', label:'第三方支付通道管理', permission:10980 },
].filter((x)=>checkPermission(x.permission)));

// 提款列表
const withdrawQuery = reactive<Record<string, any>>({ Applicant:'',OrderId:'',HandlerName:'',ShowName:'',AccountType:[],WithdrawAccount:'',SelectTimeType:1,AmountType:1,AmountMin:undefined,AmountMax:undefined,PayName:'',WithdrawStatus:'' });
const withdrawRange = ref<[dayjs.Dayjs,dayjs.Dayjs]>([dayjs().subtract(1,'day').startOf('day'),dayjs().endOf('day')]);
const withdrawTotal = reactive<Record<string,number>>({});
const selected = ref<Record<string,unknown>[]>([]);
const withdrawChannels=ref<Record<string,unknown>[]>([]);
const withdrawCount=ref(0), exportPass=ref<InstanceType<typeof PassPopup>>();
const autoRefreshStatus=ref(2);
let autoRefreshTimer:ReturnType<typeof setInterval>|undefined;
const actionOpen=ref(false), actionKind=ref<'agree'|'manual'|'refuse'|'remark'>('manual'), actionRow=ref<Record<string,unknown>>({});
const actionForm=reactive<Record<string,any>>({ RefundScore:1,HandlerInf:'',RefuseTitle:'',Remark:'',WithdrawAccountId:'' });
const detailOpen=ref(false), detailTitle=ref(''), detailRows=ref<Record<string,unknown>[]>([]);
const autoOpen=ref(false), autoRules=ref<Record<string,any>[]>([]), autoSetting=reactive<Record<string,any>>({Id:'',Status:0,RealNameBlockStatus:0,ValidCode:''}), autoRemoveIds=ref<Array<number|string>>([]);
const autoTotal=ref(0);
function withdrawalParams(page:any, exp=false) {
  return { ...withdrawQuery, AccountType:Array.isArray(withdrawQuery.AccountType)?withdrawQuery.AccountType.join(','):'', AmountMin:Number(withdrawQuery.AmountMin||0)*100, AmountMax:Number(withdrawQuery.AmountMax||0)*100,
    BeginTime:withdrawRange.value?.[0]?.unix()||'',EndTime:withdrawRange.value?.[1]?.unix()||'',Page:exp?1:page.currentPage,PageSize:exp?99999:page.pageSize,IsExp:exp,Auto:autoRefreshStatus.value===1,WithdrawStatus:withdrawQuery.WithdrawStatus??'' };
}
function assertWithdrawDateSpan(){
  const start=withdrawRange.value?.[0], end=withdrawRange.value?.[1];
  if(!start||!end){message.warning('请选择时间范围');return false;}
  if(end.diff(start,'day')>30){message.warning('查询时间跨度不能超过 30 天');return false;}
  return true;
}
const withdrawGridOptions:VxeTableGridOptions<Record<string,unknown>>={
  columns:[
    {type:'checkbox',width:48},{field:'Status',title:'状态',minWidth:110,formatter:({row})=>withdrawStatus(row)},
    {field:'ApplyAccount',title:'代理账号',minWidth:130,slots:{default:'applyAccount'}},{field:'CreateTime',title:'申请时间',minWidth:160,formatter:({cellValue})=>dt(cellValue)},
    {field:'FinanceTime',title:'财务响应时间',minWidth:160,formatter:({cellValue})=>dt(cellValue)},{field:'FinishTime',title:'结束时间',minWidth:160,formatter:({cellValue})=>dt(cellValue)},
    {field:'PayType',title:'提款方式',minWidth:110,formatter:({cellValue})=>payType[Number(cellValue)]||String(cellValue??'-')},{field:'OrderId',title:'订单编号',minWidth:190},
    {field:'PayAccount',title:'出款账号',minWidth:170,formatter:({row})=>[row.PayName,row.DigitalType,row.PayAccount].filter(Boolean).join(' / ')||'-'},{field:'PayRealName',title:'持卡人',minWidth:120},{field:'ApplyAmount',title:'申请金额',minWidth:110,formatter:({cellValue})=>money(cellValue),sortable:true},
    {field:'ExchangeRate',title:'汇率',minWidth:90},{field:'DigitalNum',title:'虚拟货币数量',minWidth:110},{field:'RateAmount',title:'通道费率',minWidth:100,formatter:({cellValue})=>money(cellValue)},
    {field:'RealAmount',title:'实际出款',minWidth:110,formatter:({cellValue})=>money(cellValue)},{field:'ShowName',title:'出款通道',minWidth:140},
    {field:'HandlerInf',title:'操作说明',minWidth:160},{field:'HandlerName',title:'操作人员',minWidth:110},{field:'Remark',title:'备注',minWidth:150},
    {field:'IsFirstWithdraw',title:'是否首提',minWidth:90,formatter:({cellValue})=>Number(cellValue)===1?'是':'否'},
    {field:'ProcessingTime',title:'处理时长',minWidth:110,formatter:({cellValue})=>formatDuration(cellValue)},{field:'actions',title:'操作',fixed:'right',minWidth:300,slots:{default:'actions'}},
  ],checkboxConfig:{checkMethod:({row})=>Number(row.Status)===1},height:'auto',pagerConfig:{pageSize:20},proxyConfig:{ajax:{query:async({page})=>{
    if(!assertWithdrawDateSpan())return{items:[],total:0};
    try{
      const r=await fetchDrawmoneyListApi(withdrawalParams(page));
      Object.keys(withdrawTotal).forEach((key)=>delete withdrawTotal[key]);
      Object.assign(withdrawTotal,r.Total||{});
      const items=r.Items||[];
      withdrawCount.value=Number(r.Pagination?.MaxCount||0);
      return{items,total:withdrawCount.value};
    }catch{
      Object.keys(withdrawTotal).forEach((key)=>delete withdrawTotal[key]);
      withdrawCount.value=0;
      return{items:[],total:0};
    }
  }}}};
const [WithdrawGrid,withdrawGridApi]=useVbenVxeGrid({gridOptions:withdrawGridOptions,gridEvents:{checkboxAll:({records}:any)=>selected.value=records,checkboxChange:({records}:any)=>selected.value=records}});
function openAction(kind:typeof actionKind.value,row:Record<string,unknown>){actionKind.value=kind;actionRow.value=row;Object.assign(actionForm,{RefundScore:1,HandlerInf:'',RefuseTitle:'',Remark:row.Remark||'',WithdrawAccountId:''});actionOpen.value=true;}
async function submitAction(){
  try{
    let data:Record<string,unknown>={Id:actionRow.value.Id};
    if(actionKind.value==='manual') await drawmoneyRequest.manualConfirm({...data,Handle:3});
    else if(actionKind.value==='agree'){
      if(!actionForm.WithdrawAccountId)return void message.warning('请选择出款通道');
      await drawmoneyRequest.manualAgree({...data,WithdrawAccountId:actionForm.WithdrawAccountId});
    } else if(actionKind.value==='refuse'){
      if(!actionForm.RefuseTitle)return void message.warning('请选择或输入拒绝原因');
      data={...data,RefundScore:actionForm.RefundScore||1,RefuseTitle:actionForm.RefuseTitle,RefuseEmailBody:actionForm.HandlerInf,HandlerInf:actionForm.RefuseTitle,Remark:actionForm.Remark};
      await drawmoneyRequest.manualRefuse(data);
    } else await drawmoneyRequest.addRemark({Id:actionRow.value.Id,Remark:actionForm.Remark});
    actionOpen.value=false;message.success('操作成功');withdrawGridApi.reload();
  }catch{/* 全局拦截已提示 */}
}
async function start(row:Record<string,unknown>){Modal.confirm({title:'开始处理',content:`确定开始处理「${row.ApplyName||row.ApplyAccount||''}」的提款申请？`,onOk:async()=>{try{await orderOperateApi({Id:row.Id,Status:2,Money:row.ApplyAmount,Desc:''});message.success('操作成功');withdrawGridApi.reload();}catch{/* */}}});}
async function prepareAgree(row:Record<string,unknown>){try{const r=await drawmoneyRequest.withdrawChannels({Ids:row.Id,Handle:1,Type:row.AccountType});withdrawChannels.value=r.Items||[];openAction('agree',row);}catch{withdrawChannels.value=[];}}
async function viewLogs(row:Record<string,unknown>,remarks=false){try{const r=remarks?await drawmoneyRequest.listRemarks({Id:row.Id}):await drawmoneyRequest.withdrawLogs({OrderId:row.OrderId});detailRows.value=r.Items||[];detailTitle.value=remarks?'备注记录':'出款记录';detailOpen.value=true;}catch{detailRows.value=[];}}
async function transition(row:Record<string,unknown>){try{await drawmoneyRequest.transitionPending({Id:row.Id});message.success('已转待处理');withdrawGridApi.reload();}catch{/* */}}
async function checkWithdraw(row:Record<string,unknown>){Modal.confirm({title:'提现查询',content:'确定要发送提现查询吗？',onOk:async()=>{try{await drawmoneyRequest.check(row.OrderId as string);message.success('查询请求已发送');}catch{/* */}}});}
async function batchManual(){if(!selected.value.length)return;Modal.confirm({title:'批量人工出款',content:'确认将所选订单批量转为人工出款？',onOk:async()=>{try{await drawmoneyRequest.batchManual({Ids:selected.value.map(x=>x.Id).join(',')});message.success('批量操作成功');withdrawGridApi.reload();}catch{/* */}}});}
async function batchRefuse(){if(!selected.value.length)return;Modal.confirm({title:'批量拒绝出款',content:'确认拒绝所选订单并退币？',onOk:async()=>{try{await drawmoneyRequest.batchRefuse({Ids:selected.value.map(x=>x.Id).join(','),RefundScore:1});message.success('批量操作成功');withdrawGridApi.reload();}catch{/* */}}});}
async function loadAutoRefresh(){try{const result=await drawmoneyRequest.autoRefresh({Key:'agentwithdraw'});autoRefreshStatus.value=result==='open'?1:2;resetAutoTimer();}catch{autoRefreshStatus.value=2;}}
function resetAutoTimer(){if(autoRefreshTimer)clearInterval(autoRefreshTimer);autoRefreshTimer=autoRefreshStatus.value===1?setInterval(()=>{const start=withdrawRange.value?.[0],end=withdrawRange.value?.[1];if(start&&end&&end.diff(start,'day')<=30)withdrawGridApi.reload();},15000):undefined;}
async function toggleAutoRefresh(checked:boolean){try{await drawmoneyRequest.saveAutoRefresh({Key:'agentwithdraw',Status:checked?'open':'close'});autoRefreshStatus.value=checked?1:2;resetAutoTimer();message.success('切换成功');}catch{/* */}}
function resetWithdraw(){Object.assign(withdrawQuery,{Applicant:'',OrderId:'',HandlerName:'',ShowName:'',AccountType:[],WithdrawAccount:'',SelectTimeType:1,AmountType:1,AmountMin:undefined,AmountMax:undefined,PayName:'',WithdrawStatus:''});withdrawRange.value=[dayjs().subtract(1,'day').startOf('day'),dayjs().endOf('day')];withdrawGridApi.reload();}
function filterPending(){withdrawQuery.WithdrawStatus='1,5,6';withdrawGridApi.reload();}
function buildWithdrawExportQuery(){const{Page:_p,PageSize:_s,IsExp:_e,...rest}=withdrawalParams({currentPage:1,pageSize:20});return rest;}
function exportWithdraw(){if(withdrawCount.value<1)return void message.warning('暂无数据可导出');if(!assertWithdrawDateSpan())return;exportPass.value?.validate(73);}
async function submitExport(security:Record<string,unknown>){try{const query=buildWithdrawExportQuery();const result=await exportDrawmoneyListApi({...query,...security});if(result?.Id&&Number(result.Status)===0){Modal.confirm({title:'提示',content:'导出任务已建立，是否前往下载管理？',onOk:()=>router.push('/operationalManage/downloadCsvManage')});}else message.error(result?.Remark||'建立导出任务失败');}catch{/* */}}
async function openAuto(){
  try{
    const r:any=await drawmoneyRequest.autoSettings({Page:1,PageSize:999});
    const item=(r.Item||{}) as Record<string,any>;
    Object.assign(autoSetting,{Id:item.Id||'',Status:Number(item.AutoWithdrawStatus||0),RealNameBlockStatus:Number(item.RealNameBlockStatus||0),ValidCode:''});
    autoTotal.value=Number((r.Total as Record<string,unknown> | undefined)?.TotalAutoWithdrawalAmount||0);
    const accounts=(await drawmoneyRequest.channelAccounts({Page:1,PageSize:999})).Items||[];
    withdrawChannels.value=accounts.filter((x)=>Number(x.Switch)===1);
    autoRules.value=(Array.isArray(r.Rules)?r.Rules:[]).map((x:any)=>({...x,PayType:Number(x.PayType||0),AutoWithdrawAmountMin:Number(x.AutoWithdrawAmountMin||0)/100,AutoWithdrawAmountMax:Number(x.AutoWithdrawAmountMax||0)/100,AutoWithdrawalAmount:Number(x.AutoWithdrawalAmount||0)/100,AgentWithdrawAccount:String(x.AgentWithdrawAccount||'')}));
    autoRemoveIds.value=[];autoOpen.value=true;
  }catch{message.warning('加载自动出款设置失败');}
}
function addAutoRule(){autoRules.value.push({PayType:1,AutoWithdrawAmountMin:1,AutoWithdrawAmountMax:1,AgentWithdrawAccount:'',AutoWithdrawalAmount:0});}
function removeAutoRule(row:Record<string,any>){if(row.Id)autoRemoveIds.value.push(row.Id);autoRules.value.splice(autoRules.value.indexOf(row),1);}
async function saveAuto(){
  if(!autoSetting.ValidCode)return void message.warning('请输入谷歌验证码');
  const duplicate=autoRules.value.some((r,i,a)=>a.findIndex((x)=>x.PayType===r.PayType&&x.AutoWithdrawAmountMin===r.AutoWithdrawAmountMin&&x.AutoWithdrawAmountMax===r.AutoWithdrawAmountMax)!==i);
  if(duplicate)return void message.warning('自动出款档位不可重复');
  const invalid=autoRules.value.some((x)=>!x.PayType||Number(x.AutoWithdrawAmountMin)<=0||Number(x.AutoWithdrawAmountMax)<Number(x.AutoWithdrawAmountMin));
  if(invalid)return void message.warning('请正确填写通道类型及金额范围');
  try{
    const rules=autoRules.value.map((x)=>({...x,PayType:String(x.PayType||''),AgentWithdrawAccount:String(x.AgentWithdrawAccount||''),AutoWithdrawAmountMin:Number(x.AutoWithdrawAmountMin)*100,AutoWithdrawAmountMax:Number(x.AutoWithdrawAmountMax)*100,AutoWithdrawalAmount:Number(x.AutoWithdrawalAmount||0)*100}));
    await drawmoneyRequest.saveAutoSettings({Id:autoSetting.Id,Status:autoSetting.Status,RealNameBlockStatus:autoSetting.RealNameBlockStatus,ValidCode:autoSetting.ValidCode,Rules:JSON.stringify(rules),RemoveIds:autoRemoveIds.value.join(',')});
    autoOpen.value=false;message.success('自动出款设置已保存');
  }catch{/* */}
}

// 黑名单
const blackKeyword=ref(''), blackOpen=ref(false), blackEditing=ref(false), blackForm=reactive({Id:'',Account:'',Desc:'',CreateAccount:''});
const blackGridOptions:VxeTableGridOptions<Record<string,unknown>>={columns:[{type:'seq',title:'序号',width:60},{field:'CreateTime',title:'日期',formatter:({cellValue})=>dt(cellValue),minWidth:160},{field:'BlackAccount',title:'代理账号',minWidth:140,slots:{default:'blackAccount'}},{field:'Desc',title:'备注',minWidth:180},{field:'CreateAccount',title:'创建人',minWidth:120},{field:'actions',title:'操作',slots:{default:'actions'},width:150}],height:'auto',pagerConfig:{pageSize:20},proxyConfig:{ajax:{query:async({page})=>{try{const r=await fetchDrawmoneyBlacklistApi({Keyword:blackKeyword.value,Page:page.currentPage,PageSize:page.pageSize});return{items:r?.Items||[],total:Number(r?.Pagination?.MaxCount||0)};}catch{return{items:[],total:0};}}}}};
const [BlackGrid,blackGridApi]=useVbenVxeGrid({gridOptions:blackGridOptions});
function editBlack(row?:Record<string,unknown>){blackEditing.value=!!row;Object.assign(blackForm,{Id:row?.Id||'',Account:row?.BlackAccount||'',Desc:row?.Desc||'',CreateAccount:row?.CreateAccount||''});blackOpen.value=true;}
async function saveBlack(){if(!blackForm.Account)return void message.warning('代理账号必填');try{const data={Id:blackForm.Id,Account:blackForm.Account,Desc:blackForm.Desc};if(blackEditing.value)await editDrawmoneyBlackApi(data);else await addDrawmoneyBlackApi(data);blackOpen.value=false;message.success('保存成功');blackGridApi.reload();}catch{/* */}}
async function removeBlack(row:Record<string,unknown>){Modal.confirm({title:'删除黑名单',content:`确认删除「${row.BlackAccount}」？`,onOk:async()=>{try{await deleteDrawmoneyAccountApi(row.Id as string);message.success('删除成功');blackGridApi.reload();}catch{/* */}}});}

// 出款类型与通道策略
const types=ref<Record<string,unknown>[]>([]), channelType=ref<number|string>(''), channelFormOpen=ref(false), channelForm=reactive<Record<string,any>>({});
async function loadTypes(){try{types.value=(await fetchDrawingsChannelSettingListApi()).sort((a,b)=>Number(a.Sort||0)-Number(b.Sort||0));if(!channelType.value)channelType.value=String(types.value[0]?.WithdrawType||'');channelGridApi.reload();}catch{types.value=[];}}
const channelGridOptions:VxeTableGridOptions<Record<string,unknown>>={columns:[
  {field:'Switch',title:'启用',width:80,slots:{default:'switch'}},{field:'ScriptStatus',title:'脚本状态',minWidth:100,formatter:({row})=>Number(row.HandleType)===2?(row.ScriptStatus?'在线':'离线'):'--'},{field:'ScriptMode',title:'脚本模式',minWidth:100,formatter:({cellValue})=>Number(cellValue)===1?'自动':'手动'},
  {field:'Switch',title:'通道状态',minWidth:100,formatter:({row})=>Number(row.HandleType)===1?(Number(row.Switch)===1?'生效':'未生效'):(Number(row.Switch)===1&&Number(row.Money)!==0&&row.ScriptStatus?'生效':'未生效')},{field:'AccountType',title:'通道类型',minWidth:110,formatter:({cellValue})=>payType[Number(cellValue)]||String(cellValue??'-')},
  {field:'HandleType',title:'账号类型',minWidth:100,formatter:({row})=>Number(row.ThirdWithdrawId)!==0?'第三方账户':Number(row.HandleType)===1?'签约账户':'普通用户'},{field:'AccountNum',title:'出款账号',minWidth:150,formatter:({row})=>row.ThirdWithdrawId?row.ShowName:row.AccountNum},{field:'RealName',title:'名称',minWidth:120},{field:'AisleBalance',title:'通道余额',formatter:({cellValue})=>money(cellValue),minWidth:110},
  {field:'Money',title:'今日出款上限',formatter:({cellValue})=>money(cellValue),minWidth:120},{field:'PerMulti',title:'单次提款倍数',minWidth:110},{field:'Rate',title:'费率',minWidth:90},
  {field:'MinOrderMoney',title:'单笔下限',formatter:({cellValue})=>money(cellValue),minWidth:100},{field:'MaxOrderMoney',title:'单笔上限',formatter:({cellValue})=>money(cellValue),minWidth:100},
  {field:'SupportBank',title:'支持银行',minWidth:120},{field:'Round',title:'权重',minWidth:80},{field:'Description',title:'说明',minWidth:160},{field:'DailyAccTimes',title:'日累计调用次数',minWidth:120},{field:'DailyAccAmount',title:'日累计出款金额',formatter:({cellValue})=>money(cellValue),minWidth:130},
  {field:'actions',title:'操作',fixed:'right',width:230,slots:{default:'actions'}},
],height:'auto',pagerConfig:{pageSize:20},proxyConfig:{ajax:{query:async({page})=>{try{const r=await drawmoneyRequest.channelAccounts({AccountType:channelType.value,Page:page.currentPage,PageSize:page.pageSize});const items=r.Items||[],statuses=items.length?await drawmoneyRequest.channelStatus(items.map(x=>x.Id).join(',')):[];statuses.forEach((s)=>{const row=items.find((x)=>String(x.Id)===String(s.Id));if(row)row.ScriptStatus=s.Status;});return{items,total:Number(r.Pagination?.MaxCount||0)};}catch{return{items:[],total:0};}}}}};
const [ChannelGrid,channelGridApi]=useVbenVxeGrid({gridOptions:channelGridOptions});
async function toggleChannel(row:Record<string,unknown>,checked:boolean){try{await drawmoneyRequest.channelSwitch({Id:row.Id,Switch:checked?1:2});message.success('切换成功');channelGridApi.reload();}catch{/* */}}
function editChannel(row:Record<string,unknown>){Object.assign(channelForm,row,{kind:'account',Money:Number(row.Money||0)===99999999999?undefined:Number(row.Money||0)/100,MinOrderMoney:Number(row.MinOrderMoney||0)/100,MaxOrderMoney:Number(row.MaxOrderMoney||0)/100});channelFormOpen.value=true;}
async function saveChannel(){try{if(checkPermission(12738))await drawmoneyRequest.channelLimit({Id:channelForm.Id,Money:channelForm.Money===undefined?99999999999:Number(channelForm.Money||0)*100});if(checkPermission(12737))await drawmoneyRequest.channelRound({Id:channelForm.Id,Round:channelForm.Round,ScriptMode:channelForm.ScriptMode});channelFormOpen.value=false;message.success('保存成功');channelGridApi.reload();}catch{/* */}}
async function toggleType(item:Record<string,unknown>,checked:boolean){try{await drawmoneyRequest.typeSwitch({Id:item.Id,WithdrawType:item.WithdrawType,IsOpen:checked});message.success('切换成功');await loadTypes();}catch{/* */}}
async function moveType(index:number,offset:number){const target=index+offset;if(target<0||target>=types.value.length)return;const copy=[...types.value];[copy[index],copy[target]]=[copy[target]!,copy[index]!];types.value=copy;try{await drawmoneyRequest.exchangeTypes({Ids:copy.map((x)=>x.Id).join(',')});message.success('排序已保存');await loadTypes();}catch{await loadTypes();}}
function editType(item:Record<string,unknown>){Object.assign(channelForm,item,{kind:'type',DailyWithdrawLimit:Number(item.DailyWithdrawLimit||0)/100});channelFormOpen.value=true;}
async function saveChannelForm(){if(channelForm.kind==='type'){if(Number(channelForm.WithdrawMin)<=0||Number(channelForm.WithdrawMax)<Number(channelForm.WithdrawMin))return void message.warning('请填写正确的提款范围');try{await drawmoneyRequest.typeLimit({...channelForm,DailyWithdrawLimit:Number(channelForm.DailyWithdrawLimit||0)*100});channelFormOpen.value=false;message.success('保存成功');await loadTypes();}catch{/* */}}else await saveChannel();}
async function refreshBalance(row:Record<string,unknown>){try{await drawmoneyRequest.updateBalance({Ids:row.Id});message.success('余额已刷新');channelGridApi.reload();}catch{/* */}}
async function offShelf(row:Record<string,unknown>){if(!row.ThirdWithdrawId)return;try{await drawmoneyRequest.channelShelf({Id:row.ThirdWithdrawId,OnShelf:2});message.success('已下架');channelGridApi.reload();}catch{/* */}}

// 第三方支付通道
const thirdName=ref(''), thirdStatus=ref<number|string>(''), thirdFormOpen=ref(false), thirdSecretOpen=ref(false), thirdForm=reactive<Record<string,any>>({}), secretFields=ref<Array<{description:string;name:string}>>([]);
const thirdGridOptions:VxeTableGridOptions<Record<string,unknown>>={columns:[
  {type:'seq',title:'序号',width:60},{field:'ShowName',title:'第三方支付名称',minWidth:160},{field:'CreateTime',title:'创建时间',formatter:({cellValue})=>dt(cellValue),minWidth:160},
  {field:'PayType',title:'支付类型',formatter:({cellValue})=>payType[Number(cellValue)]||String(cellValue??'-'),minWidth:110},{field:'Rate',title:'费率',minWidth:90},
  {field:'MinDayMoney',title:'每日下限',formatter:({cellValue})=>money(cellValue),minWidth:100},{field:'MaxDayMoney',title:'每日上限',formatter:({cellValue})=>money(cellValue),minWidth:100},
  {field:'MinOrderMoney',title:'单笔下限',formatter:({cellValue})=>money(cellValue),minWidth:100},{field:'MaxOrderMoney',title:'单笔上限',formatter:({cellValue})=>money(cellValue),minWidth:100},
  {field:'SupportBank',title:'支持银行',minWidth:160},{field:'AisleBalance',title:'通道余额',formatter:({cellValue})=>money(cellValue),minWidth:110},
  {field:'TotalAmount',title:'累计金额',formatter:({cellValue})=>money(cellValue),minWidth:110},{field:'TotalCount',title:'累计订单',minWidth:100},{field:'Description',title:'备注',minWidth:140},
  {field:'OnShelf',title:'上架状态',slots:{default:'shelf'},width:100},{field:'actions',title:'操作',slots:{default:'actions'},fixed:'right',width:160},
],height:'auto',pagerConfig:{pageSize:20},proxyConfig:{ajax:{query:async({page})=>{try{const r=await drawmoneyRequest.thirdList({ShowName:thirdName.value,OnShelf:thirdStatus.value,Page:page.currentPage,PageSize:page.pageSize});return{items:r.Items||[],total:Number(r.Pagination?.MaxCount||0)};}catch{return{items:[],total:0};}}}}};
const [ThirdGrid,thirdGridApi]=useVbenVxeGrid({gridOptions:thirdGridOptions});
function editThird(row:Record<string,unknown>){Object.assign(thirdForm,row,{Id:row.ThirdWithdrawId||row.Id,WithdrawId:row.ThirdWithdrawId?row.Id:undefined,fromStrategy:!!row.ThirdWithdrawId,CustomRate:Number(row.CustomRate||0)/10000,MinDayMoney:Number(row.MinDayMoney||0)/100,MaxDayMoney:Number(row.MaxDayMoney||0)/100,MinOrderMoney:Number(row.MinOrderMoney||0)/100,MaxOrderMoney:Number(row.MaxOrderMoney||0)/100,SupportBank:row.SupportBank?String(row.SupportBank).split(','):(projectConfig.value?.BankList||[]).map((b:any)=>b.BankCode)});thirdFormOpen.value=true;}
async function saveThird(){if(Number(thirdForm.MaxDayMoney)<Number(thirdForm.MinDayMoney)||Number(thirdForm.MaxOrderMoney)<Number(thirdForm.MinOrderMoney))return void message.warning('最大金额不能小于最小金额');try{const d={Id:thirdForm.Id,WithdrawId:thirdForm.WithdrawId,Description:thirdForm.Description,RateType:thirdForm.RateType,Rate:thirdForm.Rate,CustomRate:Number(thirdForm.CustomRate||0)*10000,PerMulti:thirdForm.PerMulti,MinDayMoney:Number(thirdForm.MinDayMoney||0)*100,MaxDayMoney:Number(thirdForm.MaxDayMoney||0)*100,MinOrderMoney:Number(thirdForm.MinOrderMoney||0)*100,MaxOrderMoney:Number(thirdForm.MaxOrderMoney||0)*100,SupportBank:Array.isArray(thirdForm.SupportBank)?thirdForm.SupportBank.join(','):thirdForm.SupportBank};await drawmoneyRequest.channelEdit(d);if(thirdForm.fromStrategy)await drawmoneyRequest.channelShelf({Id:thirdForm.Id,OnShelf:1});thirdFormOpen.value=false;message.success('保存成功');thirdForm.fromStrategy?channelGridApi.reload():thirdGridApi.reload();}catch{/* */}}
async function shelf(row:Record<string,unknown>,checked:boolean){if(checked){if(!row.AgentParams)return void message.warning('请先设置通道密钥');try{if(Object.values(JSON.parse(String(row.AgentParams))).some((v)=>!v))return void message.warning('请完整填写通道密钥');}catch{return void message.warning('通道密钥格式错误');}}try{await drawmoneyRequest.channelShelf({Id:row.Id,OnShelf:checked?1:2});message.success('切换成功');thirdGridApi.reload();}catch{/* */}}
function editSecret(row:Record<string,unknown>){let params:Record<string,unknown>={};try{params=row.AgentParams?JSON.parse(String(row.AgentParams)):{};}catch{}Object.assign(thirdForm,row,{Paramss:params});try{secretFields.value=JSON.parse(String(row.Params||'[]'));}catch{secretFields.value=[]}thirdSecretOpen.value=true;}
async function saveSecret(){try{await drawmoneyRequest.thirdEditParams({Id:thirdForm.Id,Params:JSON.stringify(thirdForm.Paramss)});thirdSecretOpen.value=false;message.success('密钥保存成功');thirdGridApi.reload();}catch{/* */}}

onMounted(()=>{active.value=tabs.value[0]?.key||'';if(active.value==='channel')loadTypes();if(checkPermission(12749))loadAutoRefresh();});
onUnmounted(()=>{if(autoRefreshTimer)clearInterval(autoRefreshTimer);});
</script>

<template>
  <Page v-if="tabs.length > 0" auto-content-height description="代理网赚 · 提款管理" title="提款管理">
    <Card>
<Tabs v-model:active-key="active" type="card" @change="(key)=>key === 'channel' && loadTypes()">
      <Tabs.TabPane v-for="tab in tabs" :key="tab.key" :tab="tab.label">
        <template v-if="tab.key === 'drawings' && checkPermission(10158)">
          <Space class="mb-3 flex flex-wrap" wrap>
            <Input v-model:value="withdrawQuery.Applicant" placeholder="代理账号" /><Input v-model:value="withdrawQuery.OrderId" placeholder="订单号" />
            <Input v-model:value="withdrawQuery.HandlerName" placeholder="操作人员" /><Input v-model:value="withdrawQuery.ShowName" placeholder="出款通道" />
            <Input v-model:value="withdrawQuery.WithdrawAccount" placeholder="出款账号" /><Input v-model:value="withdrawQuery.PayName" placeholder="持卡人" />
            <Select v-model:value="withdrawQuery.AccountType" mode="multiple" :options="Object.entries(payType).slice(0,4).map(([value,label])=>({value:Number(value),label}))" placeholder="提款方式" style="min-width:150px" />
            <Select v-model:value="withdrawQuery.AmountType" :options="[{label:'申请金额',value:1},{label:'实际出款',value:2}]" style="width:120px" />
            <Select v-model:value="withdrawQuery.SelectTimeType" :options="[{label:'申请时间',value:1},{label:'结束时间',value:2},{label:'财务响应时间',value:3}]" />
            <DatePicker.RangePicker v-model:value="withdrawRange" show-time /><InputNumber v-model:value="withdrawQuery.AmountMin" placeholder="最小金额" /><InputNumber v-model:value="withdrawQuery.AmountMax" placeholder="最大金额" />
            <Select v-model:value="withdrawQuery.WithdrawStatus" allow-clear placeholder="状态" :options="[{label:'待处理',value:'1'},{label:'已出款',value:'2'},{label:'退款驳回',value:'3'},{label:'不退款驳回',value:'4'},{label:'出款异常',value:'5'},{label:'处理中',value:'6'}]" style="width:130px" />
            <Button type="primary" @click="withdrawGridApi.reload()">查询</Button><Button @click="resetWithdraw">重置</Button><Button @click="exportWithdraw">导出 Excel</Button>
            <Button v-if="checkPermission(12032)" type="primary" ghost @click="openAuto">自动出款设置</Button>
            <span v-if="checkPermission(12749)">自动刷新 <Switch :checked="autoRefreshStatus === 1" @change="(v)=>toggleAutoRefresh(!!v)" /></span>
            <Button type="primary" :disabled="selected.length === 0" @click="batchManual">批量人工出款</Button>
            <Button danger :disabled="selected.length === 0" @click="batchRefuse">批量拒绝出款</Button>
          </Space>
          <Space class="mb-3" wrap>
            <Statistic title="总出款" :value="money(withdrawTotal.ApplyAmount ?? withdrawTotal.Amount)" /><Statistic title="实际出款" :value="money(withdrawTotal.WithdrawAmount)" />
            <Statistic title="退款金额" :value="money(withdrawTotal.RefundAmount)" /><Statistic title="待处理" :value="withdrawTotal.PendingCountNum || 0" />
            <Statistic title="挂起" :value="withdrawTotal.HangupCount || 0" /><Statistic title="预约" :value="withdrawTotal.ReserveCount || 0" />
            <Button v-if="Number(withdrawTotal.PendingCountNum) > 0" danger type="link" @click="filterPending">查看未处理订单</Button>
          </Space>
          <WithdrawGrid>
            <template #applyAccount="{ row }">
              <AgencyAccountLink
                :admin-id="resolveAgencyAdminId(row)"
                :username="row.ApplyAccount"
              />
            </template>
            <template #actions="{row}">
<Space :size="0" wrap>
              <Button v-if="checkPermission(10162) && Number(row.Status) === 1 && Number(row.Process) === 1" type="link" size="small" @click="start(row)">开始处理</Button>
              <Button v-if="checkPermission(12742) && ((Number(row.Status) === 1 && [2,3].includes(Number(row.Process))) || (Date.now() / 1000 > Number(row.sendTime || 0) + 180 && ![2,3,4].includes(Number(row.Status))))" type="link" size="small" @click="openAction('manual',row)">人工出款</Button>
              <Button v-if="checkPermission(12743) && Number(row.Status) === 1 && [2,3].includes(Number(row.Process))" type="link" size="small" @click="prepareAgree(row)">同意出款</Button>
              <Button v-if="checkPermission(12745) && Number(row.Status) === 1 && [2,3].includes(Number(row.Process))" danger type="link" size="small" @click="openAction('refuse',row)">拒绝出款</Button>
              <Button v-if="checkPermission(12747) && Number(row.Status) === 5 && Number(row.Process) === 9" type="link" size="small" @click="checkWithdraw(row)">提现查询</Button>
              <Button v-if="checkPermission(12748) && Number(row.Status) === 5 && Number(row.Process) === 9" type="link" size="small" @click="transition(row)">转待处理</Button>
              <Button type="link" size="small" @click="viewLogs(row)">出款记录</Button>
              <Button v-if="checkPermission(12751)" type="link" size="small" @click="openAction('remark',row)">备注</Button>
              <Button v-if="checkPermission(12750) && row.CreateAdminId" type="link" size="small" @click="router.push(`/netcash/agencyAccountDetails/${row.CreateAdminId}`)">代理详情</Button>
            </Space>
</template>
          </WithdrawGrid>
        </template>
        <Result v-else-if="tab.key === 'drawings'" status="403" sub-title="无提款列表查看权限" title="403" />
        <template v-else-if="tab.key === 'black' && checkPermission(10163)">
          <Space class="mb-3"><Input v-model:value="blackKeyword" placeholder="全部" /><Button type="primary" @click="blackGridApi.reload()">查询</Button><Button @click="()=>{blackKeyword = '';blackGridApi.reload()}">重置</Button><Button v-if="checkPermission(10165)" type="primary" @click="editBlack()">新增黑名单</Button></Space>
          <BlackGrid>
            <template #blackAccount="{ row }">
              <AgencyAccountLink
                :admin-id="resolveAgencyAdminId(row)"
                :username="row.BlackAccount"
              />
            </template>
            <template #actions="{row}"><Button v-if="checkPermission(10166)" type="link" @click="editBlack(row)">编辑</Button><Button v-if="checkPermission(10167)" danger type="link" @click="removeBlack(row)">删除</Button></template></BlackGrid>
        </template>
        <Result v-else-if="tab.key === 'black'" status="403" sub-title="无提款黑名单查看权限" title="403" />
        <template v-else-if="tab.key === 'channel' && checkPermission(11697)">
          <Space class="mb-4" wrap><Card v-for="(item,index) in types" :key="String(item.Id)" size="small" hoverable @click="channelType = item.WithdrawType as string;channelGridApi.reload()"><Space direction="vertical"><Space><b>{{ payType[Number(item.WithdrawType)] || item.I18nKey || item.WithdrawType }}</b><Switch :checked="Number(item.IsOpen) === 1" :disabled="!checkPermission(11698)" @click.stop @change="(v)=>toggleType(item,!!v)" /><Button v-if="checkPermission(12105)" type="link" size="small" @click.stop="editType(item)">编辑</Button></Space><span>手续费率 {{ item.ServiceRate || 0 }}%</span><span>提款范围 {{ item.WithdrawMin || 0 }} - {{ item.WithdrawMax || 0 }}</span><Space><Button size="small" :disabled="index === 0" @click.stop="moveType(index,-1)">上移</Button><Button size="small" :disabled="index === types.length - 1" @click.stop="moveType(index,1)">下移</Button></Space></Space></Card></Space>
          <ChannelGrid v-if="checkPermission(12727) && checkPermission(12734)">
            <template #switch="{row}"><Switch :checked="Number(row.Switch) === 1" :disabled="!checkPermission(12736)" @change="(v)=>toggleChannel(row,!!v)" /></template>
            <template #actions="{row}"><Button v-if="(checkPermission(12738) || checkPermission(12737)) && Number(row.Switch) === 2" type="link" @click="editChannel(row)">策略设置</Button><Button v-if="checkPermission(12735) && Number(row.Switch) === 2 && row.ThirdWithdrawId" type="link" @click="editThird(row)">通道设置</Button><Button type="link" @click="refreshBalance(row)">刷新余额</Button><Button v-if="checkPermission(12739) && row.ThirdWithdrawId" danger type="link" @click="offShelf(row)">下架</Button></template>
          </ChannelGrid>
        </template>
        <Result v-else-if="tab.key === 'channel'" status="403" sub-title="无提款通道管理查看权限" title="403" />
        <template v-else-if="tab.key === 'third' && checkPermission(10987)">
          <Space class="mb-3"><Input v-model:value="thirdName" placeholder="第三方名称" /><Select v-model:value="thirdStatus" allow-clear placeholder="上架状态" :options="[{label:'上架',value:1},{label:'下架',value:2}]" style="width:130px" /><Button type="primary" @click="thirdGridApi.reload()">查询</Button><Button @click="()=>{thirdName = '';thirdStatus = '';thirdGridApi.reload()}">重置</Button></Space>
          <ThirdGrid>
            <template #shelf="{row}"><Switch :checked="Number(row.OnShelf) === 1" :disabled="!checkPermission(11023)" @change="(v)=>shelf(row,!!v)" /></template>
            <template #actions="{row}"><Button v-if="checkPermission(10988) && Number(row.OnShelf) !== 1" type="link" @click="editThird(row)">通道设置</Button><Button v-if="checkPermission(10990)" :disabled="Number(row.OnShelf) === 1" type="link" @click="editSecret(row)">密钥管理</Button></template>
          </ThirdGrid>
        </template>
        <Result v-else-if="tab.key === 'third'" status="403" sub-title="无第三方支付通道查看权限" title="403" />
        <Result v-else status="403" sub-title="无访问权限" title="403" />
      </Tabs.TabPane>
    </Tabs>
</Card>

    <Modal v-model:open="actionOpen" :title="{manual:'人工出款',agree:'同意出款',refuse:'拒绝出款',remark:'备注'}[actionKind]" @ok="submitAction">
      <Form layout="vertical">
        <template v-if="actionKind === 'refuse'"><Form.Item label="是否退币"><Radio.Group v-model:value="actionForm.RefundScore"><Radio :value="1">退款</Radio></Radio.Group></Form.Item><Form.Item label="拒绝原因"><Select v-model:value="actionForm.RefuseTitle" :options="[{label:'提款账号与姓名不符',value:'提款账号与姓名不符'},{label:'其他',value:'其他'}]" /></Form.Item><Form.Item v-if="actionForm.RefuseTitle === '其他'" label="操作说明"><Input.TextArea v-model:value="actionForm.HandlerInf" /></Form.Item></template>
        <Form.Item v-if="actionKind === 'agree'" label="出款通道" required><Select v-model:value="actionForm.WithdrawAccountId" :options="withdrawChannels.map(x=>({label:x.ShowName,value:x.Id}))" /></Form.Item>
        <Descriptions v-if="actionKind === 'manual' || actionKind === 'agree'" bordered size="small"><Descriptions.Item label="真实姓名">{{ actionRow.PayRealName }}</Descriptions.Item><Descriptions.Item label="申请金额">{{ money(actionRow.ApplyAmount) }}</Descriptions.Item><Descriptions.Item label="实际出款">{{ money(actionRow.RealAmount) }}</Descriptions.Item></Descriptions>
        <Form.Item v-if="actionKind === 'refuse' || actionKind === 'remark'" label="备注"><Input.TextArea v-model:value="actionForm.Remark" :maxlength="400" /></Form.Item>
      </Form>
    </Modal>
    <Modal v-model:open="detailOpen" :footer="null" :title="detailTitle" width="800px"><Descriptions v-for="(row,i) in detailRows" :key="i" bordered size="small" class="mb-2"><Descriptions.Item v-for="(value,key) in row" :key="key" :label="String(key)">{{ value }}</Descriptions.Item></Descriptions></Modal>
    <Modal v-model:open="autoOpen" title="自动出款设置" width="900px" @ok="saveAuto">
      <Space class="mb-3"><span>功能开关</span><Switch v-model:checked="autoSetting.Status" :checked-value="1" :un-checked-value="0" /><Checkbox v-model:checked="autoSetting.RealNameBlockStatus" :disabled="autoSetting.Status === 1" :true-value="1" :false-value="0">真实姓名超过 5 个字不可自动出款</Checkbox><Button :disabled="autoSetting.Status === 1" @click="addAutoRule">新增档位</Button><Statistic title="今日已自动出款总额" :value="money(autoTotal)" /></Space>
      <div v-for="(rule,index) in autoRules" :key="rule.Id || index" class="mb-2 flex items-center gap-2"><Select v-model:value="rule.PayType" :disabled="autoSetting.Status === 1 || !!rule.Id" :options="Object.entries(payType).slice(0,4).map(([value,label])=>({value:Number(value),label}))" style="width:130px" /><InputNumber v-model:value="rule.AutoWithdrawAmountMin" :disabled="autoSetting.Status === 1" :min="1" placeholder="最小金额" /><span>—</span><InputNumber v-model:value="rule.AutoWithdrawAmountMax" :disabled="autoSetting.Status === 1" :min="1" placeholder="最大金额" /><Select v-model:value="rule.AgentWithdrawAccount" allow-clear :disabled="autoSetting.Status === 1" :options="withdrawChannels.filter(x=>!rule.PayType || Number(x.AccountType) === Number(rule.PayType)).map(x=>({label:`${x.ShowName || x.AccountNum}（${Number(x.ScriptMode) === 1 ? '自动' : '手动'}）`,value:String(x.Id)}))" placeholder="出款通道" style="width:210px" /><span>今日已出 {{ rule.AutoWithdrawalAmount || 0 }}</span><Button danger :disabled="autoSetting.Status === 1" @click="removeAutoRule(rule)">删除</Button></div>
      <Input.Password v-model:value="autoSetting.ValidCode" class="mt-3" placeholder="谷歌验证码（保存必填）" />
    </Modal>
    <Modal v-model:open="blackOpen" :title="blackEditing ? '编辑黑名单' : '新增黑名单'" @ok="saveBlack"><Form layout="vertical"><Form.Item label="代理账号" required><Input v-model:value="blackForm.Account" /></Form.Item><Form.Item label="备注"><Input v-model:value="blackForm.Desc" :maxlength="50" /></Form.Item><Form.Item v-if="blackEditing" label="创建人"><Input v-model:value="blackForm.CreateAccount" disabled /></Form.Item></Form></Modal>
    <Modal v-model:open="channelFormOpen" :title="channelForm.kind === 'type' ? '编辑出款类型' : '通道策略设置'" @ok="saveChannelForm"><Form layout="vertical"><template v-if="channelForm.kind === 'type'"><Form.Item label="最小提款金额"><InputNumber v-model:value="channelForm.WithdrawMin" class="w-full" :min="1" /></Form.Item><Form.Item label="最大提款金额"><InputNumber v-model:value="channelForm.WithdrawMax" class="w-full" :min="1" /></Form.Item><Form.Item label="手续费率"><InputNumber v-model:value="channelForm.ServiceRate" class="w-full" :min="0" addon-after="%" /></Form.Item><Form.Item label="每日提款限额"><InputNumber v-model:value="channelForm.DailyWithdrawLimit" class="w-full" :min="0" /></Form.Item><Form.Item label="单次提款倍数"><Select v-model:value="channelForm.PerMulti" :options="[-1,0,10,50,100,500,1000,5000,10000].map(value=>({value,label:value === -1 ? '使用出款设置' : value === 0 ? '全部' : `${value}倍`}))" /></Form.Item></template><template v-else><Form.Item v-if="checkPermission(12738)" label="今日出款金额上限"><InputNumber v-model:value="channelForm.Money" class="w-full" placeholder="留空表示不限制" /></Form.Item><Form.Item v-if="checkPermission(12737)" label="权重"><InputNumber v-model:value="channelForm.Round" class="w-full" :min="1" :max="100" /></Form.Item><Form.Item v-if="checkPermission(12737)" label="脚本模式"><Radio.Group v-model:value="channelForm.ScriptMode"><Radio :value="1">自动</Radio><Radio :value="2">手动</Radio></Radio.Group></Form.Item></template></Form></Modal>
    <Modal v-model:open="thirdFormOpen" title="第三方通道设置" width="700px" @ok="saveThird"><Form layout="vertical"><Form.Item label="通道名称"><Input v-model:value="thirdForm.ShowName" disabled /></Form.Item><Form.Item label="费率模式"><Radio.Group v-model:value="thirdForm.RateType"><Radio :value="0">百分比</Radio><Radio :value="1">固定</Radio><Radio :value="2">混合</Radio></Radio.Group></Form.Item><Form.Item v-if="thirdForm.RateType !== 1" label="百分比费率"><InputNumber v-model:value="thirdForm.Rate" addon-after="%" /></Form.Item><Form.Item v-if="thirdForm.RateType !== 0" label="自定义费率"><InputNumber v-model:value="thirdForm.CustomRate" /></Form.Item><Form.Item v-if="thirdForm.fromStrategy" label="匹配倍数"><Select v-model:value="thirdForm.PerMulti" :options="[-1,0,10,50,100,500,1000,5000,10000].map(value=>({value,label:value === -1 ? '使用出款设置' : value === 0 ? '全部' : `${value}倍`}))" /></Form.Item><Space><Form.Item label="每日下限"><InputNumber v-model:value="thirdForm.MinDayMoney" /></Form.Item><Form.Item label="每日上限"><InputNumber v-model:value="thirdForm.MaxDayMoney" /></Form.Item><Form.Item label="单笔下限"><InputNumber v-model:value="thirdForm.MinOrderMoney" /></Form.Item><Form.Item label="单笔上限"><InputNumber v-model:value="thirdForm.MaxOrderMoney" /></Form.Item></Space><Form.Item label="支持银行"><Checkbox.Group v-model:value="thirdForm.SupportBank" :options="(projectConfig?.BankList || []).map((b:any)=>({label:b.BankName,value:b.BankCode}))" /></Form.Item><Form.Item label="备注"><Input.TextArea v-model:value="thirdForm.Description" /></Form.Item></Form></Modal>
    <Modal v-model:open="thirdSecretOpen" title="密钥管理" @ok="saveSecret"><Form layout="vertical"><Form.Item label="通道名称"><Input v-model:value="thirdForm.ShowName" disabled /></Form.Item><Form.Item v-for="field in secretFields" :key="field.name" :label="field.description"><Input.Password v-model:value="thirdForm.Paramss[field.name]" /></Form.Item></Form></Modal>
    <PassPopup ref="exportPass" title="文件密码" type="csv" @confirm="submitExport" />
  </Page>
  <Result v-else status="403" sub-title="无提款管理查看权限" title="403" />
</template>
