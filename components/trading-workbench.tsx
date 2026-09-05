"use client";
import {useEffect,useRef,useState} from 'react';
import {somniaTestnet} from 'viem/chains';
import {ConnectButton} from '@rainbow-me/rainbowkit';
import {useAccount,useChainId,useWalletClient} from 'wagmi';
import type {SomniaMarkets} from '@somnia-chain/markets-sdk';
import {createExchange} from '@/lib/exchange';
import {discoverCurrentBtc5mMarket} from '@/lib/market-discovery';
import {fetchBook} from '@/lib/live-book';
import {estimateBuyFill} from '@/lib/fill-simulation';
import {evaluateGuard} from '@/lib/guard-engine';
import {submitProtectedOrder} from '@/lib/trade-controller';
import {discoverClaims,redeemClaim} from '@/lib/claim-controller';
import {readState,saveState,emptyState,type SavedState} from '@/lib/persistence';
import type {BookSnapshot,ClaimCandidate,Outcome,OutcomeIndex,TrackedMarket} from '@/lib/types';

const short=(value:string)=>`${value.slice(0,8)}…${value.slice(-6)}`;
const message=(e:unknown)=>e instanceof Error?e.message.slice(0,350):'Request failed. Retry when the connection is available.';
const explorer=(hash:string)=>`https://shannon-explorer.somnia.network/tx/${hash}`;

export function TradingWorkbench(){
  const {address,isConnected}=useAccount();
  const chainId=useChainId();
  const {data:walletClient}=useWalletClient();
  const wallet=isConnected&&address&&chainId===somniaTestnet.id&&walletClient?address:null;
  const ex=useRef<SomniaMarkets|null>(null);
  const current=useRef<TrackedMarket|null>(null);
  const previousId=useRef<string|null>(null);
  const generation=useRef(0);
  const busyRef=useRef(false);
  const [market,setMarket]=useState<TrackedMarket|null>(null);
  const [book,setBook]=useState<BookSnapshot|null>(null);
  const [outcome,setOutcome]=useState<Outcome>('UP');
  const [quantity,setQuantity]=useState('5');
  const [limit,setLimit]=useState('0.56');
  const [minimum,setMinimum]=useState('30');
  const [now,setNow]=useState(0);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('Discovering the current BTC five-minute market…');
  const [busy,setBusy]=useState(false);
  const [reviewed,setReviewed]=useState(false);
  const [saved,setSaved]=useState<SavedState>(emptyState);
  const [claims,setClaims]=useState<ClaimCandidate[]>([]);
  const [scanned,setScanned]=useState(false);
  const [retry,setRetry]=useState(0);

  useEffect(()=>{
    const exchange=createExchange();ex.current=exchange;let disposed=false;let pending=false;
    async function discover(){
      if(pending||busyRef.current)return;pending=true;
      try{
        const next=await discoverCurrentBtc5mMarket(exchange);
        if(disposed)return;
        if(next?.marketId!==current.current?.marketId){
          generation.current++;setBook(null);setReviewed(false);
          setNotice(next&&previousId.current&&previousId.current!==next.marketId?`Window rolled: ${short(previousId.current)} → ${short(next.marketId)}. Previous preview cleared; review again.`:next?'Live market connected. Review your limits to enable submission.':'No active BTC five-minute market found. Discovery retries automatically.');
          if(next)previousId.current=next.marketId;
        }
        current.current=next;setMarket(next);setError('');
      }catch(e){if(!disposed){setError(message(e));setReviewed(false);}}
      finally{pending=false;}
    }
    void discover();const timer=setInterval(()=>void discover(),4000);
    return()=>{disposed=true;clearInterval(timer);void exchange.close();if(ex.current===exchange)ex.current=null;};
  },[retry]);

  useEffect(()=>{
    setBook(null);setReviewed(false);let disposed=false;let pending=false;
    async function refresh(){
      const exchange=ex.current;const m=current.current;
      if(!exchange||!m||pending)return;pending=true;const gen=generation.current;
      try{const next=await fetchBook(exchange,m,outcome);if(!disposed&&gen===generation.current&&current.current?.marketId===next.marketId)setBook(next);}
      catch(e){if(!disposed)setError(message(e));}finally{pending=false;}
    }
    void refresh();const timer=setInterval(()=>void refresh(),1000);
    return()=>{disposed=true;clearInterval(timer);};
  },[market?.marketId,outcome,retry]);
  useEffect(()=>{setNow(Date.now());const timer=setInterval(()=>setNow(Date.now()),250);return()=>clearInterval(timer);},[]);
  useEffect(()=>{
    generation.current++;ex.current?.setSigner({});setReviewed(false);setClaims([]);setScanned(false);setSaved(emptyState());
    if(!isConnected||!address){setNotice('Wallet disconnected. Connect and review your order before submitting.');return;}
    if(chainId!==somniaTestnet.id){setNotice('Switch to Somnia Shannon testnet before trading.');return;}
    if(!walletClient||!ex.current){setNotice('Preparing the connected wallet…');return;}
    ex.current.setSigner({walletClient});setSaved(readState(address));setError('');
    setNotice('Wallet connected. Review your limits to enable submission.');
  },[address,chainId,isConnected,walletClient,retry]);

  useEffect(()=>{
    if(!wallet||!market)return;
    const state=readState(wallet);
    if(!state.trackedMarketIds.includes(market.marketId)){
      state.trackedMarketIds=[...state.trackedMarketIds,market.marketId].slice(-500);
      try{saveState(wallet,state);setSaved(state);}catch{setError('Browser storage is unavailable. Keep transaction hashes for recovery.');}
    }
  },[wallet,market]);

  const intent=market?{marketId:market.marketId,outcome,quantity:Number(quantity),maximumAveragePrice:Number(limit),minimumSecondsRemaining:Number(minimum),createdAtMs:now}:null;
  const estimate=book?estimateBuyFill(Number(quantity),book.asks,Number(limit)):null;
  const decision=market&&book&&intent&&estimate?evaluateGuard({intent,currentMarket:market,book,estimate,nowMs:now}):null;
  const age=book?Math.max(0,now-book.capturedAtMs):null;
  const remaining=market?Math.max(0,Math.floor(market.expirySec-now/1000)):null;
  function persist(state:SavedState){setSaved(state);if(wallet)try{saveState(wallet,state);}catch{setError('Browser storage is unavailable. Keep your transaction hash for recovery.');}}

  async function submit(){
    if(busyRef.current||!ex.current||!wallet||!intent||!reviewed)return;
    busyRef.current=true;setBusy(true);setError('');setNotice('Rechecking market, chain status, book depth, and limits…');
    const gen=generation.current;const exchange=ex.current;const address=wallet;
    try{
      const result=await submitProtectedOrder(exchange,intent,()=>gen===generation.current&&exchange.walletAddress?.toLowerCase()===address.toLowerCase(),()=>setNotice('Approve the protected IOC order in your wallet. A partial or zero fill is possible.'));
      const state=readState(address);state.trackedMarketIds=Array.from(new Set([...state.trackedMarketIds,result.marketId])).slice(-500);state.trades=[result,...state.trades.filter(t=>t.clientTradeId!==result.clientTradeId)].slice(0,200);saveState(address,state);
      if(gen===generation.current)setSaved(state);
      setNotice(result.status==='REVERTED'?'Transaction reverted. No fill is reported.':`Transaction confirmed. Actual fill: ${result.filledQuantity ?? 0} contracts.`);
    }catch(e){setError(message(e));setNotice('Submission did not complete. If your wallet broadcast a transaction, inspect its history before retrying.');}
    finally{busyRef.current=false;setBusy(false);setReviewed(false);}
  }
  async function scan(){
    if(!ex.current||!wallet||busyRef.current)return;busyRef.current=true;setBusy(true);const gen=generation.current;
    try{const next=await discoverClaims(ex.current,wallet,saved.trackedMarketIds);if(gen===generation.current){setClaims(next);setScanned(true);setError('');}}catch(e){setError(message(e));}finally{busyRef.current=false;setBusy(false);}
  }
  async function redeem(claim:ClaimCandidate,index:OutcomeIndex){
    if(!ex.current||!wallet||busyRef.current)return;busyRef.current=true;setBusy(true);const gen=generation.current;
    try{const hash=await redeemClaim(ex.current,wallet,claim,index);if(gen===generation.current){persist({...saved,redemptionTxHashes:[hash,...saved.redemptionTxHashes].slice(0,200)});setClaims([]);setScanned(false);setNotice(`Redemption verified: ${hash}`);}}catch(e){setError(message(e));}finally{busyRef.current=false;setBusy(false);}
  }

  return <main className="shell">
    <nav className="nav"><div className="brand">WINDOW<span>GUARD</span></div><div className="navmeta"><span className="badge">SOMNIA SHANNON</span><span className="badge">TESTNET</span><WalletControl disabled={busy}/></div></nav>
    <section className="hero"><h1>Check the price.<br/>Protect your order.</h1><p>A final execution check for five-minute markets. Set your limits before your wallet opens.</p></section>
    <p className="notice" role="status">{notice}</p>
    {error&&<div className="notice" role="alert">{error} <button className="secondary" disabled={busy} onClick={()=>{ex.current?.setSigner({});setRetry(x=>x+1);}}>Reconnect market data</button></div>}
    <section className="workspace" aria-label="Order protection workbench"><div className="main">
      <header className="market"><div><span className="label">Current market</span><strong>BTC five-minute Up / Down</strong></div><div><span className="label">Market ID</span><span className="value" title={market?.marketId}>{market?short(market.marketId):'Awaiting market'}</span></div><div><span className="label">Status</span><span className="value">{market?.status??'UNAVAILABLE'}</span></div><div><span className="label">Remaining</span><span className="value countdown">{remaining===null?'--:--':`${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(remaining%60).padStart(2,'0')}`}</span></div></header>
      <div className="formarea"><form className="intent" onSubmit={e=>{e.preventDefault();void submit();}}><h2 className="sectiontitle">Order intent</h2><fieldset disabled={busy}><div className="toggle" role="group" aria-label="Outcome">{(['UP','DOWN'] as Outcome[]).map(side=><button type="button" aria-pressed={outcome===side} className={outcome===side?'active':''} key={side} onClick={()=>setOutcome(side)}>Buy {side==='UP'?'Up':'Down'}</button>)}</div><div className="fields"><Field id="quantity" label="Quantity" value={quantity} change={v=>{setQuantity(v);setReviewed(false);}} min="0.01" max="25" step="0.001"/><Field id="limit" label="Maximum price per contract" value={limit} change={v=>{setLimit(v);setReviewed(false);}} min="0.001" max="0.999" step="0.001"/><Field id="time" label="Minimum seconds remaining" value={minimum} change={v=>{setMinimum(v);setReviewed(false);}} min="1" max="299" step="1"/></div></fieldset></form>
      <div className="check"><h2 className="sectiontitle">Execution check</h2><Metric name="Best ask" value={book?.bestAsk?.toFixed(3)??'Unavailable'}/><Metric name="Estimated average" value={estimate?.averagePrice?.toFixed(3)??'Unavailable'}/><Metric name="Worst accepted price" value={estimate?.worstPrice?.toFixed(3)??'Unavailable'}/><Metric name="Available within limit" value={estimate?`${estimate.fillableQuantity.toFixed(3)} / ${quantity}`:'Unavailable'}/><Metric name="Book age" value={age===null?'Awaiting snapshot':`${age} ms`}/></div></div>
      <div className={`verdict ${decision?.allowed?'safe':'blocked'}`} role="status"><h2>{decision?decision.code.replaceAll('_',' '):'WAITING FOR LIVE DATA'}</h2><p>{decision?.reasons[0]??'Submission requires a verified current market and fresh order book.'}</p>{decision?.code==='INSUFFICIENT_DEPTH'&&estimate&&estimate.fillableQuantity>0&&<button className="secondary" disabled={busy} onClick={()=>{setQuantity(String(estimate.fillableQuantity));setReviewed(false);}}>Use {estimate.fillableQuantity} contracts</button>}</div>
      <label className="review"><input type="checkbox" checked={reviewed} disabled={busy||!market||!decision?.allowed} onChange={e=>setReviewed(e.target.checked)}/> I reviewed this market and my maximum price.</label>
      <button className="submit" disabled={busy||!wallet||!decision?.allowed||!reviewed} onClick={submit}>{busy?'Request in progress':!wallet?'Connect wallet to trade':'Review and submit protected order'}</button>
      <section className="activity"><h2 className="sectiontitle">Order activity</h2>{saved.trades.length===0?<p>No orders recorded for this wallet.</p>:saved.trades.map(t=><article key={t.clientTradeId}><strong>{t.status} · {t.outcome}</strong><p>{t.filledQuantity===undefined?'Fill not verified':`${t.filledQuantity} / ${t.requestedQuantity} filled${t.actualAveragePrice!==undefined?` at ${t.actualAveragePrice.toFixed(4)} average`:''}`}</p>{t.txHash&&<a href={explorer(t.txHash)} target="_blank" rel="noreferrer">View transaction {short(t.txHash)}</a>}</article>)}</section>
    </div><aside className="side"><div className="sidehead"><h2>Executable depth</h2><span className="age">{age===null?'NO SNAPSHOT':age>2500?'STALE':`${age} MS`}</span></div><div className="bookhead"><span>Side</span><span>Price</span><span>Quantity</span></div>{!book?<p className="claim">Waiting for the current book.</p>:book.asks.length===0?<p className="claim">No executable asks available.</p>:book.asks.map((level,i)=><div className="bookrow" key={`${level.price}-${i}`}><span className="ask">ASK {i+1}</span><span>{level.price.toFixed(3)}</span><span>{level.quantity.toFixed(3)}</span></div>)}<div className="spread"><span>SPREAD</span><strong className="mono">{book?.spread?.toFixed(3)??'Unavailable'}</strong></div>{book?.bids.map((level,i)=><div className="bookrow" key={`${level.price}-${i}`}><span className="bid">BID {i+1}</span><span>{level.price.toFixed(3)}</span><span>{level.quantity.toFixed(3)}</span></div>)}
      <section className="claim"><h2 className="sectiontitle">Payable positions</h2><div className="claimbox"><strong>{scanned&&!claims.length?'No payable positions found':'Recorded-market claims'}</strong><p>Scans up to 120 market IDs recorded by this wallet in WindowGuard. Each balance is verified on-chain.</p><button className="secondary" disabled={!wallet||busy} onClick={scan}>Scan recorded markets</button>{claims.map(c=><article key={c.marketId}><p>{short(c.marketId)} · {c.lifecycle}</p>{c.claimableOutcomes.map(i=><button className="secondary" key={i} disabled={busy} onClick={()=>redeem(c,i)}>Redeem {i===0?'Up':'Down'}</button>)}</article>)}{saved.redemptionTxHashes.map(hash=><p key={hash}><a href={explorer(hash)} target="_blank" rel="noreferrer">Redemption {short(hash)}</a></p>)}</div></section>
    </aside></section><p className="risk">Testnet prototype. Event Contracts can lose the full amount committed. WindowGuard checks execution conditions; it does not predict outcomes or guarantee fills.</p>
  </main>;
}
function Metric({name,value}:{name:string;value:string}){return <div className="metric"><span>{name}</span><strong>{value}</strong></div>;}
function Field({id,label,value,change,min,max,step}:{id:string;label:string;value:string;change:(v:string)=>void;min:string;max:string;step:string}){return <div className="field"><label htmlFor={id}>{label}</label><input id={id} type="number" value={value} onChange={e=>change(e.target.value)} min={min} max={max} step={step} required/></div>;}
function WalletControl({disabled}:{disabled:boolean}){return <ConnectButton.Custom>{({account,chain,mounted,openAccountModal,openChainModal,openConnectModal})=>{const ready=mounted;const connected=ready&&account&&chain;return <div aria-hidden={!ready} style={!ready?{opacity:0,pointerEvents:'none',userSelect:'none'}:undefined}>{!connected?<button type="button" className="connect" disabled={disabled} onClick={openConnectModal}>Connect wallet</button>:chain.unsupported?<button type="button" className="connect" disabled={disabled} onClick={openChainModal}>Wrong network</button>:<button type="button" className="connect" disabled={disabled} onClick={openAccountModal}>{account.displayName}</button>}</div>;}}</ConnectButton.Custom>;}
