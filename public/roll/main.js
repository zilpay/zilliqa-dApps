const max = 100;

var zilliqa;
var utils;
var contract;
var currentHash;

var rollValue = 51;
var contractAddress = 'e8a997e359ac2a1e891dbdf7fc7558623bb0ead2';

var winAmount = 200;
var amountZil = 100;


$('input[type=range]').on('input', function () {
  $('#roll-view').html(this.value);
  rollValue = this.value;
  
  winAmount = (max / rollValue) * amountZil;

  $('#amount')[0].value = amountZil;
  $('#winAmount')[0].value = winAmount;
});

$('#amount').on('input', function () {
  amountZil = this.value;
  
  winAmount = (max / rollValue) * amountZil;

  $('#winAmount')[0].value = winAmount;
});

$('#amount')[0].value = amountZil;
$('#winAmount')[0].value = winAmount;


window.addEventListener("load", () => {
  const test = testZilPay();

  if (!test) {
    return null;
  }

  zilliqa = new Zilliqa();
  utils = zilliqa.utils;
  contract = zilliqa.contracts.at(contractAddress);

  window.zilPay.observableAccount().subscribe(() => {
    $('#myaddress').text(window.zilPay.defaultAccount.address);
  });
  getState();
});

function testZilPay() {
  if (!window.zilPay) {
    $('#zilpayModal > div > div > div.modal-body').html(`
    <div class="row justify-content-md-center">
      <h1 class="text-center text-warning">Please install <a href="https://zilpay.xyz/">ZilPay</a></h1>
      <img src="/img/home.png">
    </div>
    `);
    $('#zilpayModal').modal();
    return false;
  } else if (!window.zilPay.isEnable) {
    $('.modal-body').html(`
      <div class="row justify-content-md-center">
        <h1 class="text-center text-warning">Please unlock <a href="https://zilpay.xyz/">ZilPay</a></h1>
        <img src="/img/lock.png">
      </div>
    `);
    $('#zilpayModal').modal();
    return 'lock';
  }
  return true;
}

async function getState() {
  let state = await contract.getState();

  state = state.filter(el => el.vname == '_balance');
  const { value } = state[0];
  const balance = utils.units.fromQa(
    new utils.BN(value), 'zil'
  );

  $('body > div.container.mt-5 > div > div > div.alert.alert-info.balance')
    .html(`contract Balance: ${balance} <span class="text-muted">ZIL</span>`);
}

async function roll() {
  const test = testZilPay();

  if (!test) {
    return null;
  } else if (test == 'lock') {
    return null;
  }

  const roll = $('#formControlRange')[0].value;
  const amount = utils.units.toQa(
    $('#amount')[0].value,
    utils.units.Units.Zil
  );
  const gasPrice = utils.units.toQa(
    '5000', utils.units.Units.Li
  );
  const tx = await contract.call(
    'Roll', [{
      vname: "rol",
      type: "Uint128",
      value: roll
    }],
    {
      amount: amount,
      gasPrice: gasPrice,
      gasLimit: utils.Long.fromNumber(9000)
    }
  );
  
  $('body > div.container.mt-5 > div > div > div.form-group > button').hide();
  $('#spiner').show();
  currentHash = tx.TranID;

  let int = setInterval(async () => {
    let zilliqa = new Zilliqa();
    let utils = zilliqa.utils;

    zilliqa.blockchain
           .getTransaction(currentHash)
           .then(tx => {

              $('body > div.container.mt-5 > div > div > div.form-group > button').show();
              $('#spiner').hide();

              const event = tx.receipt.event_logs[0];
              const { params } = event;
              const winAmount = params.filter(el => el.vname == 'winAmount')[0].value;
              const rol = params.filter(el => el.vname == 'rol')[0].value;
              const entropy = params.filter(el => el.vname == 'entropy')[0].value;
              const isWin = +rol > +entropy ? 'win' : 'lose';
              const amount = utils.units.fromQa(
                new utils.BN(winAmount), 'zil'
              );

              $('#zilpayModal > div > div > div.modal-body').html(`
              <div class="row justify-content-md-center">
                <div class="jumbotron bg-secondary">
                  <h1 class="display-5 text-warning">you ${isWin} ${amount} ZIL</h1>
                  <p class="lead">rol: ${rol}</p>
                  <hr class="my-4">
                  <p>value: ${entropy}</p>
                </div>
              </div>
              `);
              $('#zilpayModal').modal();
              getState();
              clearInterval(int);
           })
           .catch(err => console.log(err));
  }, 4000);
}

async function retrunFond() {
  const test = testZilPay();

  if (!test) {
    return null;
  } else if (test == 'lock') {
    return null;
  }

  const gasPrice = utils.units.toQa(
    '3000', utils.units.Units.Li
  );
  const tx = await contract.call(
    'ReturnFund', [],
    {
      amount: new utils.BN(0),
      gasPrice: gasPrice,
      gasLimit: utils.Long.fromNumber(8000)
    }
  );
  console.log(tx);
}