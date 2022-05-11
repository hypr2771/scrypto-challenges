use scrypto::prelude::*;

blueprint! {
    struct Auction {
        admin_badge_def: ResourceAddress,
        uuid: u128,
        badges: Bucket,
        initial_price: Decimal,
        bin_price: Decimal
    }

    impl Auction {
        // given a price in XRD, creates a ready-to-use gumball machine
        pub fn instantiate_gumball_machine(initial_price: Decimal, bin_price: Decimal) -> Auction {

            let uuid = Runtime::generate_uuid();

            // Create the admin badges
        let badges: Bucket = ResourceBuilder::new_fungible().divisibility(DIVISIBILITY_NONE)
        .metadata("name", format!("Auction {} owner", uuid.into()))
        .initial_supply(dec!(1));

            let component = Self {
                admin_badge_def: badges.resource_address(),
                uuid,
                badges,
                initial_price,
                bin_price,
            }.instantiate();

            // Define the access rules for this blueprint.
            let access_rules = AccessRules::new()
                .method("do_admin_task", rule!(require(badges.resource_address())));

            // Return the component and the badges
            (component.add_access_check(access_rules).globalize(), badges)

        }
    }
}
