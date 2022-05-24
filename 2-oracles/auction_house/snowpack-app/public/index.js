import { DefaultApi, ManifestBuilder } from 'pte-sdk';
import { getAccountAddress, signTransaction } from 'pte-browser-extension-sdk';

let packageAddress = '01b2bb80086758d313b6f4a773d5b22054324cfe3026cc910d25bf';
let accountAddress = '';
let auctionList = [];
let defaultApi = new DefaultApi()

window.onload = async function () {
  accountAddress = await getAccountAddress();
}

document.getElementById('fetch_account_address').onclick = async function () {
  document.getElementById('accountId').value = accountAddress;
};

document.getElementById('publish_contract').onclick = async function () {
  const response = await fetch('./auction.wasm');
  const wasm = new Uint8Array(await response.arrayBuffer());

  const manifest = new ManifestBuilder()
    .publishPackage(wasm)
    .build()
    .toString();

  const receipt = await signTransaction(manifest);
  packageAddress = receipt.newPackages[0];

  console.log(packageAddress)
}


document.getElementById('create_auction').onclick = async function () {
  let startingPrice = document.getElementById('startingPrice').value
  let binPrice = document.getElementById('binPrice').value
  // Construct manifest
  const manifest = new ManifestBuilder()
    .callMethod(accountAddress, 'withdraw_by_amount', ['Decimal("1")', 'ResourceAddress("030000000000000000000000000000000000000000000000000004")'])
    .takeFromWorktop('030000000000000000000000000000000000000000000000000004', 'auction_bucket')
    .callFunction(packageAddress, 'Auction', 'new', ['Decimal("' + startingPrice + '")', 'Decimal("' + binPrice * 10 + '")', 'Bucket("auction_bucket")'])
    .callMethodWithAllResources(accountAddress, 'deposit_batch')
    .build()
    .toString();


  const receipt = await signTransaction(manifest);

  let auction = {
    auctionId : receipt.newComponents[0],
    badgeRessource : '',
    badgeId : ''
  }

  auctionList.push(auction);

  let componentInfos = await defaultApi.getComponent({ address: [auction.auctionId] });
  let componentState = JSON.parse(componentInfos.state).fields;
  
  /* 
  Creating Element looking like this
  <div class="one-third column value">
    <h2 class="value-multiplier">19000 $XRD</h2>
    <h5 class="value-heading">Renault 5</h5>
    <p class="value-description">ID : 23456768846754563436</p>
    <input value="price"> <button> BID </button>
  </div>
  */

  //create the div
  let div = document.createElement("div")
  div.id = auction.auctionId;
  div.className = "one-third column value";

  //create the content
  let currentPrice = document.createElement("h4");
  currentPrice.textContent = "Current price : " + componentState[1].value.match(/"([^"]+)"/)[1] + " $xrd";
  div.appendChild(currentPrice);

  let NFTSold = document.createElement("h5");
  NFTSold.textContent = "NFT sold : " + componentState[5].value.match(/"([^"]+)"/)[1].substring(0, 10) +  '...';
  div.appendChild(NFTSold);

  let idAuction = document.createElement("h5");
  idAuction.textContent = "id : " + BigInt(componentState[0].value).toString().substring(0, 14) + '...';
  div.appendChild(idAuction);

  let input = document.createElement("input");
  div.appendChild(input)

  let button = document.createElement("button");
  button.textContent = " BID "
  button.onclick = async () => {
    /*
  CALL_METHOD ComponentAddress("$participant_3") "create_proof_by_ids" TreeSet<NonFungibleId>(NonFungibleId("$participant_3_badge_id")) ResourceAddress("$participant_3_badges_resource");
  CREATE_PROOF_FROM_AUTH_ZONE_BY_IDS TreeSet<NonFungibleId>(NonFungibleId("$participant_3_badge_id")) ResourceAddress("$participant_3_badges_resource") Proof("proof_of_participation");

  CALL_METHOD ComponentAddress("$participant_3") "withdraw_by_amount" Decimal("3") ResourceAddress("$xrd");
  TAKE_FROM_WORKTOP_BY_AMOUNT Decimal("3") ResourceAddress("$xrd") Bucket("bidding_bucket");

  CALL_METHOD ComponentAddress("$auction") "bid" Bucket("bidding_bucket") Proof("proof_of_participation");
  CALL_METHOD_WITH_ALL_RESOURCES ComponentAddress("$participant_3") "deposit_batch";
    */
  let bidValue = document.getElementById(auction.auctionId).querySelector('input').value

  const manifestBid = new ManifestBuilder()
  .callMethod(accountAddress, 'create_proof_by_ids', [ 'TreeSet<NonFungibleId>(NonFungibleId("'+ auction.badgeId +'"))', 'ResourceAddress("'+auction.badgeRessource+'")'])
  .createProofFromAuthZoneByIds([ auction.badgeId], auction.badgeRessource, "proof_of_participation")
  .callMethod(accountAddress, "withdraw_by_amount", ['Decimal("'+bidValue+'")', 'ResourceAddress("030000000000000000000000000000000000000000000000000004")'])
  .takeFromWorktopByAmount(parseFloat(bidValue), "030000000000000000000000000000000000000000000000000004", "bidding_bucket" )
  .callMethod(auction.auctionId, "bid",['Bucket("bidding_bucket")',  'Proof("proof_of_participation")'] )
  .callMethodWithAllResources(accountAddress, "deposit_batch")
  .build()
  .toString()

  const receiptBid = await signTransaction(manifestBid);
  let currentBid = JSON.parse(receiptBid.outputs[4]).elements[2].value;

  document.getElementById(auction.auctionId).querySelector('h4').textContent = "Current price : " + currentBid.match(/"([^"]+)"/)[1] + " $xrd";

  }
  div.appendChild(button)
  document.getElementById('auctions').appendChild(div);

  let registrationButton = document.createElement("button");
  registrationButton.textContent = "Register";
  registrationButton.onclick = async () => {

    const manifestRegistration = new ManifestBuilder()
    .callMethod(auction.auctionId, "register", [])
    .callMethodWithAllResources(accountAddress, "deposit_batch")
    .build()
    .toString()

    const receiptRegistration = await signTransaction(manifestRegistration);
    auction.badgeRessource = JSON.parse(receiptRegistration.outputs[0]).elements[1].value
    auction.badgeId = JSON.parse(receiptRegistration.outputs[0]).elements[2].value
  }
  div.appendChild(registrationButton);
}



