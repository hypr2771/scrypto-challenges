import { DefaultApi, ManifestBuilder } from 'pte-sdk';
import { getAccountAddress, signTransaction } from 'pte-browser-extension-sdk';

let packageAddress = '01949121963ef6416efe3da3ea74865bb8f4611b0598851d6ca64a';
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
}


document.getElementById('create_auction').onclick = async function () {
  let startingPrice = document.getElementById('startingPrice').value
  // Construct manifest
  const manifest = new ManifestBuilder()
    .callMethod(accountAddress, 'withdraw_by_amount', ['Decimal("1")', 'ResourceAddress("030000000000000000000000000000000000000000000000000004")'])
    .takeFromWorktop('030000000000000000000000000000000000000000000000000004', 'auction_bucket')
    .callFunction(packageAddress, 'Auction', 'new', ['Decimal("' + startingPrice + '")', 'Decimal("' + startingPrice * 10 + '")', 'Bucket("auction_bucket")'])
    .callMethodWithAllResources(accountAddress, 'deposit_batch')
    .build()
    .toString();


  const receipt = await signTransaction(manifest);

  auctionList.push(receipt.newComponents[0]);
  console.log(await defaultApi.getComponent({ address: [auctionList[0]] }));

}



