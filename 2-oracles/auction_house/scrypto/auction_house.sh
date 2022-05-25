#!/bin/bash

resim reset

export package=$(resim publish auction/ | grep "New Package" | cut -d: -f2 | xargs)

export owner_account=$(resim new-account)
export owner=$(echo $owner_account | grep "Account component address:" | cut -d ' ' -f10 | xargs)
export owner_private_key=$(echo $owner_account | grep "Private key:" | cut -d ' ' -f16)

resim set-default-account $owner $owner_private_key

export xrd=$(resim show $owner | grep XRD | cut -d: -f3 | cut -d, -f1 | xargs)

cat <<EOT > manifests/create_auction_house.manifest
CALL_FUNCTION PackageAddress("$package") "AuctionHouse" "new";
EOT


export component=$(resim run manifests/create_auction_house.manifest | grep "Component:" | cut -d: -f2 | xargs)

cat <<EOT > manifests/create_auction_from_auction_house.manifest
CALL_METHOD ComponentAddress("$owner") "withdraw_by_amount" Decimal("1") ResourceAddress("$xrd");
TAKE_FROM_WORKTOP_BY_AMOUNT Decimal("1") ResourceAddress("$xrd") Bucket("auction_house_bucket");

CALL_METHOD ComponentAddress("$component") "create_new_auction" Decimal("1") Decimal("10") Bucket("auction_house_bucket");
CALL_METHOD_WITH_ALL_RESOURCES ComponentAddress("$owner") "deposit_batch";
EOT

cat <<EOT > manifests/create_auction_from_auction_house2.manifest
CALL_METHOD ComponentAddress("$owner") "withdraw_by_amount" Decimal("1") ResourceAddress("$xrd");
TAKE_FROM_WORKTOP_BY_AMOUNT Decimal("1") ResourceAddress("$xrd") Bucket("auction_house_bucket");

CALL_METHOD ComponentAddress("$component") "create_new_auction" Decimal("1") Decimal("100") Bucket("auction_house_bucket");
CALL_METHOD_WITH_ALL_RESOURCES ComponentAddress("$owner") "deposit_batch";
EOT

resim run manifests/create_auction_from_auction_house.manifest
resim run manifests/create_auction_from_auction_house2.manifest

cat <<EOT > manifests/get_all_auctions.manifest
CALL_METHOD ComponentAddress("$component") "get_all_auctions";
EOT

resim run manifests/get_all_auctions.manifest