(function(){

  var uidCounter = 0;
  function uid(){ return 'a' + (uidCounter++); }

  var state = {
    monthly: 25000,
    flatYears: 5,
    cycleYears: 2,
    stepUpPct: 10,
    inflation: 6,
    milestones: [5, 10, 25],
    assets: [
      {id: uid(), name:'EPF / PF', value:0, rate:8.2, contribPct:15},
      {id: uid(), name:'PPF', value:0, rate:7.25, contribPct:10},
      {id: uid(), name:'SIP / mutual funds', value:0, rate:10, contribPct:45},
      {id: uid(), name:'Stocks', value:0, rate:7, contribPct:15},
      {id: uid(), name:'Fixed deposits', value:0, rate:7, contribPct:10},
      {id: uid(), name:'Gold', value:0, rate:10, contribPct:5}
    ]
  };

  var exampleData = {
    monthly: 50000, flatYears: 5, cycleYears: 2, stepUpPct: 10, inflation: 6, milestones:[5,10,25],
    assets: [
      {name:'EPF / PF', value:600000, rate:8.2, contribPct:15},
      {name:'PPF', value:400000, rate:7.25, contribPct:10},
      {name:'SIP / mutual funds', value:900000, rate:10, contribPct:45},
      {name:'Stocks', value:350000, rate:7, contribPct:15},
      {name:'Fixed deposits', value:200000, rate:7, contribPct:10},
      {name:'Gold', value:250000, rate:10, contribPct:5}
    ]
  };

  function inrFull(n){
    var sign = n < 0 ? '-' : '';
    n = Math.round(Math.abs(n));
    var s = n.toString();
    var last3 = s.slice(-3);
    var other = s.slice(0, -3);
    if(other !== ''){
      other = other.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
      return sign + '₹' + other + ',' + last3;
    }
    return sign + '₹' + last3;
  }
  function inrCompact(n){
    var sign = n < 0 ? '-' : '';
    var abs = Math.abs(n);
    if(abs >= 1e7) return sign + '₹' + (abs/1e7).toFixed(2) + ' Cr';
    if(abs >= 1e5) return sign + '₹' + (abs/1e5).toFixed(2) + ' L';
    return inrFull(n);
  }

  function annualContribution(year){
    var base = state.monthly * 12;
    if(year <= state.flatYears) return base;
    var cycleIndex = Math.floor((year - state.flatYears - 1) / state.cycleYears) + 1;
    return base * Math.pow(1 + state.stepUpPct/100, cycleIndex);
  }
  function contributedByYear(year){
    var total = 0;
    for(var y=1; y<=year; y++) total += annualContribution(y);
    return total;
  }

  function simulate(years, withContrib){
    var balances = {};
    state.assets.forEach(function(a){ balances[a.id] = parseFloat(a.value) || 0; });
    var totalContribPct = state.assets.reduce(function(s,a){ return s + (parseFloat(a.contribPct)||0); }, 0);
    var series = [];
    var startTotal = 0;
    state.assets.forEach(function(a){ startTotal += parseFloat(a.value)||0; });
    series.push({year:0, total:startTotal, byId: Object.assign({}, balances)});
    var months = years * 12;
    for(var m=1; m<=months; m++){
      var year = Math.ceil(m/12);
      var annualContrib = withContrib ? annualContribution(year) : 0;
      var monthlyTotal = annualContrib / 12;
      state.assets.forEach(function(a){
        var r = (parseFloat(a.rate)||0) / 100;
        var mRate = Math.pow(1+r, 1/12) - 1;
        var pct = parseFloat(a.contribPct) || 0;
        var w = withContrib ? (totalContribPct > 0 ? pct/totalContribPct : 1/state.assets.length) : 0;
        var contrib = monthlyTotal * w;
        balances[a.id] = balances[a.id]*(1+mRate) + contrib;
      });
      if(m % 12 === 0){
        var total = 0;
        state.assets.forEach(function(a){ total += balances[a.id]; });
        series.push({year: year, total: total, byId: Object.assign({}, balances)});
      }
    }
    return series;
  }

  var chart;

  function renderTable(){
    var tbody = document.getElementById('assetBody');
    tbody.innerHTML = '';
    state.assets.forEach(function(a){
      var tr = document.createElement('tr');
      tr.dataset.id = a.id;

      var tdName = document.createElement('td');
      var inpName = document.createElement('input');
      inpName.type = 'text'; inpName.value = a.name; inpName.placeholder = 'Asset name';
      inpName.addEventListener('input', function(){ a.name = inpName.value; });
      tdName.appendChild(inpName); tr.appendChild(tdName);

      var tdVal = document.createElement('td');
      var inpVal = document.createElement('input');
      inpVal.type = 'number'; inpVal.min = '0'; inpVal.step = '1000'; inpVal.value = a.value;
      inpVal.addEventListener('input', function(){ a.value = parseFloat(inpVal.value) || 0; recalc(); });
      tdVal.appendChild(inpVal); tr.appendChild(tdVal);

      var tdRate = document.createElement('td');
      var inpRate = document.createElement('input');
      inpRate.type = 'number'; inpRate.step = '0.1'; inpRate.value = a.rate;
      inpRate.addEventListener('input', function(){ a.rate = parseFloat(inpRate.value) || 0; recalc(); });
      tdRate.appendChild(inpRate); tr.appendChild(tdRate);

      var tdPct = document.createElement('td');
      var inpPct = document.createElement('input');
      inpPct.type = 'number'; inpPct.min = '0'; inpPct.step = '1'; inpPct.value = a.contribPct;
      inpPct.addEventListener('input', function(){ a.contribPct = parseFloat(inpPct.value) || 0; recalc(); });
      tdPct.appendChild(inpPct); tr.appendChild(tdPct);

      var tdM0 = document.createElement('td'); tdM0.className = 'calc m0'; tr.appendChild(tdM0);
      var tdM1 = document.createElement('td'); tdM1.className = 'calc m1'; tr.appendChild(tdM1);
      var tdM2 = document.createElement('td'); tdM2.className = 'calc m2'; tr.appendChild(tdM2);

      var tdRemove = document.createElement('td');
      var btnRemove = document.createElement('button');
      btnRemove.type = 'button'; btnRemove.className = 'remove-btn'; btnRemove.textContent = '×';
      btnRemove.setAttribute('aria-label', 'Remove asset');
      btnRemove.addEventListener('click', function(){
        state.assets = state.assets.filter(function(x){ return x.id !== a.id; });
        renderTable(); recalc();
      });
      tdRemove.appendChild(btnRemove); tr.appendChild(tdRemove);

      tbody.appendChild(tr);
    });
  }

  function recalc(){
    var realTerms = document.getElementById('realTerms').checked;
    var inflation = state.inflation;
    var maxYears = Math.max(state.milestones[0], state.milestones[1], state.milestones[2], 1);

    var withSeries = simulate(maxYears, true);
    var withoutSeries = simulate(maxYears, false);

    function realVal(val, year){
      if(!realTerms) return val;
      return val / Math.pow(1+inflation/100, year);
    }

    var currentTotal = 0;
    state.assets.forEach(function(a){ currentTotal += parseFloat(a.value)||0; });
    document.getElementById('heroTotal').textContent = inrCompact(currentTotal);
    document.getElementById('heroSub').textContent = 'Across ' + state.assets.length + (state.assets.length===1 ? ' asset class' : ' asset classes');

    state.milestones.forEach(function(y, i){
      var point = withSeries[y];
      var withVal = realVal(point.total, y);
      var contributedRaw = contributedByYear(y);
      var contributedShown = realTerms ? realVal(contributedRaw, y) : contributedRaw;
      var growth = withVal - currentTotal - contributedShown;
      document.getElementById('val'+i).textContent = inrCompact(withVal);
      document.getElementById('meta'+i).textContent = inrCompact(contributedShown) + ' contributed · ' + inrCompact(growth) + ' growth';
      document.getElementById('thM'+i+'Label').textContent = 'In ' + y + 'y';
    });

    var labels = [], withData = [], withoutData = [];
    for(var y=0; y<=maxYears; y++){
      labels.push(y===0 ? 'Now' : 'Yr ' + y);
      withData.push(Math.round(realVal(withSeries[y].total, y)));
      withoutData.push(Math.round(realVal(withoutSeries[y].total, y)));
    }
    if(chart){
      chart.data.labels = labels;
      chart.data.datasets[0].data = withData;
      chart.data.datasets[1].data = withoutData;
      chart.update();
    } else {
      var ctx = document.getElementById('growthChart');
      chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {label:'Continuing to invest', data:withData, borderColor:'#1F4D3F', backgroundColor:'rgba(31,77,63,0.08)', borderWidth:2, pointRadius:0, fill:true, tension:0.15},
            {label:'If you stopped investing today', data:withoutData, borderColor:'#6E3A4C', borderDash:[6,4], borderWidth:2, pointRadius:0, fill:false, tension:0.15}
          ]
        },
        options: {
          responsive:true, maintainAspectRatio:false,
          interaction: {mode:'index', intersect:false},
          plugins: {
            legend:{display:false},
            tooltip:{ callbacks:{ label: function(ctx){ return ctx.dataset.label + ': ' + inrCompact(ctx.parsed.y); } } }
          },
          scales: {
            x: { grid:{display:false}, ticks:{color:'#82897F', maxRotation:0, autoSkip:true} },
            y: { grid:{color:'#E7E8DE'}, ticks:{ color:'#82897F', callback:function(v){ return inrCompact(v); } } }
          }
        }
      });
    }

    var totCurrent=0, totPct=0, tot0=0, tot1=0, tot2=0;
    state.assets.forEach(function(a){
      totCurrent += parseFloat(a.value)||0;
      totPct += parseFloat(a.contribPct)||0;
      var b0 = withSeries[state.milestones[0]].byId[a.id];
      var b1 = withSeries[state.milestones[1]].byId[a.id];
      var b2 = withSeries[state.milestones[2]].byId[a.id];
      tot0 += b0; tot1 += b1; tot2 += b2;
      var tr = document.querySelector('tr[data-id="'+a.id+'"]');
      if(tr){
        tr.querySelector('.m0').textContent = inrCompact(b0);
        tr.querySelector('.m1').textContent = inrCompact(b1);
        tr.querySelector('.m2').textContent = inrCompact(b2);
      }
    });
    document.getElementById('totCurrent').textContent = inrFull(totCurrent);
    document.getElementById('totContribPct').textContent = totPct.toFixed(0) + '%';
    document.getElementById('tot0').textContent = inrCompact(tot0);
    document.getElementById('tot1').textContent = inrCompact(tot1);
    document.getElementById('tot2').textContent = inrCompact(tot2);

    var warnEl = document.getElementById('contribWarning');
    if(state.assets.length > 0 && Math.abs(totPct - 100) > 0.5){
      warnEl.style.display = 'block';
      warnEl.className = 'table-caption warn';
      warnEl.textContent = "% of monthly investment adds up to " + totPct.toFixed(0) + "%, not 100 — that's fine, they're only read relative to each other, but check they say what you mean.";
    } else {
      warnEl.style.display = 'none';
    }
  }

  function attachTopControls(){
    document.getElementById('sipMonthly').addEventListener('input', function(e){
      state.monthly = parseFloat(e.target.value)||0;
      document.getElementById('sipMonthlyOut').textContent = inrFull(state.monthly) + '/mo';
      recalc();
    });
    document.getElementById('flatYears').addEventListener('input', function(e){
      state.flatYears = parseFloat(e.target.value)||0;
      document.getElementById('flatYearsOut').textContent = state.flatYears + ' yrs';
      recalc();
    });
    document.getElementById('cycleYears').addEventListener('input', function(e){
      state.cycleYears = parseFloat(e.target.value)||1;
      document.getElementById('cycleYearsOut').textContent = state.cycleYears + ' yrs';
      recalc();
    });
    document.getElementById('stepUp').addEventListener('input', function(e){
      state.stepUpPct = parseFloat(e.target.value)||0;
      document.getElementById('stepUpOut').textContent = state.stepUpPct + '%';
      recalc();
    });
    document.getElementById('inflation').addEventListener('input', function(e){
      state.inflation = parseFloat(e.target.value)||0;
      document.getElementById('inflationOut').textContent = state.inflation + '%';
      recalc();
    });
    document.getElementById('realTerms').addEventListener('input', recalc);
    [0,1,2].forEach(function(i){
      document.getElementById('milestone'+i).addEventListener('input', function(e){
        var v = parseInt(e.target.value,10);
        if(!v || v<1) v = 1;
        if(v>60) v = 60;
        state.milestones[i] = v;
        recalc();
      });
    });
    document.getElementById('addAssetBtn').addEventListener('click', function(){
      state.assets.push({id:uid(), name:'', value:0, rate:8, contribPct:0});
      renderTable(); recalc();
    });
    document.getElementById('loadExampleBtn').addEventListener('click', function(){
      loadFromData(exampleData);
    });
    document.getElementById('exportBtn').addEventListener('click', function(){
      var out = {
        monthly: state.monthly, flatYears: state.flatYears, cycleYears: state.cycleYears,
        stepUpPct: state.stepUpPct, inflation: state.inflation, milestones: state.milestones,
        assets: state.assets.map(function(a){ return {name:a.name, value:a.value, rate:a.rate, contribPct:a.contribPct}; })
      };
      var blob = new Blob([JSON.stringify(out, null, 2)], {type:'application/json'});
      var url = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.href = url; link.download = 'portfolio-plan.json';
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
    document.getElementById('importBtn').addEventListener('click', function(){
      document.getElementById('importFile').click();
    });
    document.getElementById('importFile').addEventListener('change', function(e){
      var file = e.target.files[0];
      if(!file) return;
      var reader = new FileReader();
      reader.onload = function(evt){
        try{
          var data = JSON.parse(evt.target.result);
          loadFromData(data);
        }catch(err){
          alert("Couldn't read that file — make sure it's a portfolio plan exported from this tool.");
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });
  }

  function loadFromData(data){
    state.monthly = data.monthly || 0;
    state.flatYears = data.flatYears != null ? data.flatYears : 5;
    state.cycleYears = data.cycleYears || 2;
    state.stepUpPct = data.stepUpPct != null ? data.stepUpPct : 10;
    state.inflation = data.inflation != null ? data.inflation : 6;
    state.milestones = (data.milestones && data.milestones.length===3) ? data.milestones : [5,10,25];
    state.assets = (data.assets||[]).map(function(a){
      return {id:uid(), name:a.name||'', value:parseFloat(a.value)||0, rate:parseFloat(a.rate)||0, contribPct:parseFloat(a.contribPct)||0};
    });

    document.getElementById('sipMonthly').value = state.monthly;
    document.getElementById('sipMonthlyOut').textContent = inrFull(state.monthly) + '/mo';
    document.getElementById('flatYears').value = state.flatYears;
    document.getElementById('flatYearsOut').textContent = state.flatYears + ' yrs';
    document.getElementById('cycleYears').value = state.cycleYears;
    document.getElementById('cycleYearsOut').textContent = state.cycleYears + ' yrs';
    document.getElementById('stepUp').value = state.stepUpPct;
    document.getElementById('stepUpOut').textContent = state.stepUpPct + '%';
    document.getElementById('inflation').value = state.inflation;
    document.getElementById('inflationOut').textContent = state.inflation + '%';
    [0,1,2].forEach(function(i){ document.getElementById('milestone'+i).value = state.milestones[i]; });

    renderTable();
    recalc();
  }

  function initTooltips(){
    var tipEl = document.getElementById('sharedTooltip');
    function showTip(icon){
      var text = icon.getAttribute('data-tip');
      if(!text) return;
      tipEl.textContent = text;
      tipEl.classList.add('visible');
      var iconRect = icon.getBoundingClientRect();
      var tipRect = tipEl.getBoundingClientRect();
      var margin = 8;
      var left = iconRect.left + iconRect.width/2 - tipRect.width/2;
      if(left < margin) left = margin;
      if(left + tipRect.width > window.innerWidth - margin) left = window.innerWidth - margin - tipRect.width;
      var top = iconRect.top - tipRect.height - 8;
      if(top < margin) top = iconRect.bottom + 8;
      tipEl.style.left = left + 'px';
      tipEl.style.top = top + 'px';
    }
    function hideTip(){ tipEl.classList.remove('visible'); }
    document.querySelectorAll('.info-tip').forEach(function(icon){
      icon.addEventListener('mouseenter', function(){ showTip(icon); });
      icon.addEventListener('mouseleave', hideTip);
      icon.addEventListener('focus', function(){ showTip(icon); });
      icon.addEventListener('blur', hideTip);
    });
  }

  function initColumnResize(){
    document.querySelectorAll('.col-resize-handle').forEach(function(handle){
      function startDrag(startClientX){
        var th = handle.parentElement;
        var startWidth = th.getBoundingClientRect().width;
        handle.classList.add('active');
        function onMove(clientX){
          var newWidth = Math.max(44, startWidth + (clientX - startClientX));
          th.style.width = newWidth + 'px';
        }
        function onMouseMove(ev){ onMove(ev.clientX); }
        function onTouchMove(ev){ if(ev.touches[0]) onMove(ev.touches[0].clientX); }
        function stop(){
          handle.classList.remove('active');
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', stop);
          document.removeEventListener('touchmove', onTouchMove);
          document.removeEventListener('touchend', stop);
        }
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', stop);
        document.addEventListener('touchmove', onTouchMove, {passive:true});
        document.addEventListener('touchend', stop);
      }
      handle.addEventListener('mousedown', function(e){ e.preventDefault(); startDrag(e.clientX); });
      handle.addEventListener('touchstart', function(e){ if(e.touches[0]) startDrag(e.touches[0].clientX); }, {passive:true});
      handle.addEventListener('dblclick', function(){
        handle.parentElement.style.width = '';
      });
    });
  }

  attachTopControls();
  renderTable();
  document.getElementById('sipMonthlyOut').textContent = inrFull(state.monthly) + '/mo';
  document.getElementById('flatYearsOut').textContent = state.flatYears + ' yrs';
  document.getElementById('cycleYearsOut').textContent = state.cycleYears + ' yrs';
  document.getElementById('stepUpOut').textContent = state.stepUpPct + '%';
  document.getElementById('inflationOut').textContent = state.inflation + '%';
  initTooltips();
  initColumnResize();
  recalc();

})();
