use scrypto::prelude::*;
use crate::auction::*;

blueprint!{

    struct AuctionHouse{
        auction_list : HashMap<ComponentAddress, Auction>
    }

    impl AuctionHouse{
        pub fn new() -> ComponentAddress {
            return Self {
                auction_list: HashMap::new(), 
            }
            .instantiate()
            .globalize();
        }

        pub fn create_new_auction(&mut self, minimal_bid: Decimal, bin_price: Decimal, product: Bucket) -> (ComponentAddress, Bucket) {
            let (auction_component, owner_badge) = Auction::new(minimal_bid, bin_price, product);
            self.auction_list.insert(auction_component, auction_component.into());

            (auction_component, owner_badge)

        } 

        pub fn get_all_auctions(&self) -> HashSet<(ComponentAddress, ResourceAddress, Decimal)>{
            let mut to_return = HashSet::new();
            for (key, value) in self.auction_list.iter() {
                to_return.insert((*key , value.get_product_ressource(), value.get_current_bid()));
            }
            to_return
        }

    }
    
}