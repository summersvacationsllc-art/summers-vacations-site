/** Generic Summers Vacations co-hosting agreement. Fill-ins are [BRACKET] tokens. */

export const CONTRACT_TITLE = "Summers Vacations LLC Co-Hosting Agreement";

export type ContractFields = {
  accommodationsAddress: string;
  startDate: string;
  subscriberName: string;
  coSubscriberName: string;
  email: string;
  phone: string;
  mailingAddress: string;
  signatureName: string;
  signatureDate: string;
  coSignatureName: string;
  coSignatureDate: string;
};

export const EMPTY_FIELDS: ContractFields = {
  accommodationsAddress: "",
  startDate: "",
  subscriberName: "",
  coSubscriberName: "",
  email: "",
  phone: "",
  mailingAddress: "",
  signatureName: "",
  signatureDate: "",
  coSignatureName: "",
  coSignatureDate: "",
};

/** Fake fill-ins so the printed sample looks complete. Not a real owner. */
export const SAMPLE_FIELDS: ContractFields = {
  accommodationsAddress: "100 Sample Lane, Branson, MO 65616",
  startDate: "October 1, 2026",
  subscriberName: "Jane Q. Sample",
  coSubscriberName: "John Q. Sample",
  email: "jane.sample@example.com",
  phone: "(555) 010-0199",
  mailingAddress: "200 Example Drive, Springfield, MO 65804",
  signatureName: "Jane Q. Sample",
  signatureDate: "October 1, 2026",
  coSignatureName: "John Q. Sample",
  coSignatureDate: "October 1, 2026",
};

export function fill(template: string, fields: ContractFields): string {
  const map: Record<string, string> = {
    ACCOMMODATIONS_ADDRESS: fields.accommodationsAddress,
    START_DATE: fields.startDate,
    SUBSCRIBER_NAME: fields.subscriberName,
    CO_SUBSCRIBER_NAME: fields.coSubscriberName,
    EMAIL: fields.email,
    PHONE: fields.phone,
    MAILING_ADDRESS: fields.mailingAddress,
    SIGNATURE_NAME: fields.signatureName,
    SIGNATURE_DATE: fields.signatureDate,
    CO_SIGNATURE_NAME: fields.coSignatureName,
    CO_SIGNATURE_DATE: fields.coSignatureDate,
  };
  return template.replace(/\[([A-Z0-9_]+)\]/g, (_, key: string) => {
    const v = (map[key] || "").trim();
    return v || "________________";
  });
}

/** Full program terms as paragraphs. Tokens in [BRACKETS]. */
export const AGREEMENT_SECTIONS: { heading?: string; body: string }[] = [
  {
    heading: "Summary",
    body: `The Host will handle all aspects of the booking and rental process for your short-term rental located at the following address: [ACCOMMODATIONS_ADDRESS] (the "Accommodations"), including marketing, messaging with guests and prospective guests ("Guests"), and managing vendors, inspections, and keys. The Host's services will be referred to collectively as the co-hosting "Program," which includes Listing Optimization; Communication & Reservations; Access to Dynamic Pricing Tool; Listing Advertising & Marketing; Guest Support and Approval; Direct booking platform and Website; Social Media Platforms; Vendor Management; and Monthly property reports and payout.

HOST: Summers Vacations LLC, by Brian Summers, Authorized Person.

The fees to participate in the Host's Program (the "Host's Fee" or the "Fee") are: Subscription Fee of fifteen percent (15%) of Gross Rental Income, due monthly upon receipt of Host's invoices; Technology Fee of Fifty and 00/100 Dollars ($50.00) per month per Property; and a one-time Set-Up Fee of $0.00.

Start Date: [START_DATE]. End Date: 60 days after written notice.

By signing, each Subscriber (1) represents they have the unrestricted right to rent the Accommodations; (2) agrees to join the Program under these Program Terms; and (3) approves the fees specified in this Agreement.

Subscriber: [SUBSCRIBER_NAME]. Co-Subscriber (if any): [CO_SUBSCRIBER_NAME]. Email: [EMAIL]. Phone: [PHONE]. Mailing address: [MAILING_ADDRESS].`,
  },
  {
    heading: "Program Terms",
    body: `Host is a short-term-rental hosting and consulting company that helps vacation-home owners, investors, and developers rent their vacation properties (including all common areas, yards, and curtilage, and all other areas described in the property listing, the "Accommodations") to short-term or extended-stay guests ("Guests") under the terms of this Co-Hosting Agreement (the "Agreement"), which includes the Agreement Summary.

Subscriber has the unrestricted right to rent the Accommodations to Guests and wants to hire Host to undertake the activities specified in this Agreement on Subscriber's behalf.

Subscriber and Host may be referred to individually as a "Party" and collectively as the "Parties."

In exchange for the mutual promises, covenants, and other good-and-valuable consideration specified in this Agreement, the receipt and sufficiency of which the Parties each acknowledge, the Parties agree as specified below.`,
  },
  {
    heading: "1. The Program",
    body: `1.1 Except as specified below, the scope of the services Host agrees to provide under this Agreement is intended to be broad enough to cover all aspects of the short-term-rental ("STR") process (the "Program"). The Program includes the services specified in this Section.

1.1.1 Strategic Listing and Pricing. Host will prepare a custom listing description for the Accommodations to generate Guest interest. Subscriber shall be responsible for securing sufficiently attractive high-resolution photographs of the Accommodations at Subscriber's cost and providing those to Host. Photography is not included in the Host's Fee unless specified in a separate written agreement. Host agrees to market the home across multiple booking platforms of Host's choosing, which may include Airbnb, HomeAway, and VRBO ("Booking Sites"). Host will coordinate with Subscriber to implement its proprietary pricing algorithm ("Pricing Software") to reflect market demand.

1.1.2 Done-For-You Booking. Host will be listed on each of the Booking Sites as the point of contact for potential Guests. Host will respond to booking inquiries received through the Booking Sites and book guests based on the Subscriber's calendar availability. Subscriber is responsible for providing Host with accurate availability information through an online calendar system. Host uses instant booking to increase bookings. (Note: Some Guests using instant booking will not have been vetted by Host but will be required to book through the Booking Site.)

1.1.3 Regular and Extraordinary Cleaning. Host will coordinate all cleanings of the Accommodations by third-party cleaning services Subscriber has approved ("Cleaning Crew"). The cleanings will take place after each Guest departs (and before Guests arrive, if necessary). The Cleaning Crew will wash and replace all linens and towels for the Accommodations. The cost of each cleaning will be charged to the Guest but must be paid to the cleaning company directly by Subscriber. Host will coordinate all cleanings.

1.1.4 Supplies. Host will coordinate restocking of guest supplies with the Cleaning Crew, which may include, as applicable to the Accommodations: toilet paper and facial tissue; trash bags; paper towels; dish soap and sponges or other dish-cleaning implements; dishwasher detergent; toiletries, including hand soap, shampoo, conditioner, body wash, and lotion; surface, window, and floor cleaning solutions; brooms, mops, dry dusters, Swiffers, and other cleaning implements; and other essential items recommended by Host or agreed to by Subscriber. Subscriber is solely responsible for paying the cost of Supplies, whether drop-shipped or reimbursed to the Cleaning Crew or Host, as needed.

1.1.5 Coordinating Repairs and Maintenance. If the Accommodations need repairs, maintenance, or troubleshooting (collectively, "Repairs"), Host can assist, upon Subscriber's request, in coordinating with trusted third-party contractors (the "Contractors") to address the issue. Subscriber will be responsible for paying all costs related to the Repairs ("Repair Costs"), including fees charged by the Contractor or Host's team. Subscriber should directly contract with the Contractor for the Repairs. Host can help coordinate the repair process, but Subscriber will be responsible for paying for their services. If Host's staff (including employees, vendors, or contractors) are involved in the repair or maintenance, Subscriber may be charged a fee to cover Host's actual costs. These charges will be billed at the end of each month. It is Subscriber's responsibility to ensure that the Contractor provides any warranties or guarantees for their work. Host is not responsible for how well the Repairs are performed or for any warranty work. By agreeing to these Repairs, Subscriber understands and accepts that Host is not responsible for the quality or outcome of the Repairs. Subscriber releases Host from any claims related to the Repairs, including payment issues, personal injury, or property damage caused by the Repairs or the Contractor. Subscriber agrees to hold Host harmless and defend Host against any claims arising from the Repairs, including claims from Contractors or Guests and visitors. If, during the repair process, Subscriber and Host determine that specific or additional agreements are needed, they may create a separate agreement to govern that particular repair.

1.1.6 Direct Disbursement of Rent. All rental revenues ("Rent") earned by renting the Accommodations ("Gross Revenue") will be paid directly to Subscriber from the Booking Site platform(s) after deduction of all "Booking Charges," which include taxes, merchant account surcharges and other fees, and booking percentages charged by Booking Sites. Host will not collect or be responsible for collecting or distributing Rent under this Agreement.

1.1.7 Reporting. Host agrees to prepare monthly reports to Subscriber detailing Gross Revenue and specifying all Booking Charges and all costs and expenses incurred by Host on Subscriber's behalf. Subscriber will be provided with access to those reports by email or file-sharing folder. Those reports will be made available, with respect to each month, on or before the 15th day of the next succeeding month.

1.2 The Program does not include the following, which remain the sole responsibility of Subscriber:

1.2.1 Providing the "Minimum Accommodations," as defined below.

1.2.2 Providing maintenance on the "Amenities," as defined below.

1.2.3 Trash for the Accommodations, which may include municipal or private trash service, curb or alley pickup, or guest use of a dumpster. Subscriber is solely responsible for maintaining the trash arrangement that applies to that unit and for any fees, carts, dumpster access, or HOA rules that go with it. Guest instructions will match that arrangement. Host does not guarantee placing containers at the curb or alley on pickup days unless Subscriber and Host have agreed in writing to garbage-management services. After-stay cleaning includes removing trash from the unit and placing it in the dumpster or other designated containers, as applicable.

1.2.4 Payment of utility charges and similar costs, including charges imposed for water, electricity, gas, sewage, garbage, Internet service, parking permits, and cable television service (if included on a listing).

1.2.5 For Subscribers who lease the Accommodations, obtaining from the owner of the Accommodations written consent to sub-lease the Accommodations, in form and substance acceptable to Host in its sole discretion, and providing that written consent to Host. If Subscriber owns the Accommodations, this subsection does not apply.

1.2.6 Timely payment of Subscriber's mortgage or lease payments and the setting aside of all required cash reserves.

1.2.7 Timely payment and/or setting aside of ad valorem taxes, insurance premiums, and other similar costs.

1.2.8 Ensuring compliance with all local, state, and federal laws applicable to the ownership and operation of the Accommodations as a short-term-rental business.

1.2.9 Registration with applicable governmental authorities and the acquisition and maintenance of all permits, licenses, and other permissions required by any applicable governmental authority for the operation of the Accommodations as an STR (collectively, the "Entitlements"), including the payment of all licensing fees associated with the Entitlements.

1.2.10 The calculation and payment of all taxes and other impositions arising out of or associated with the operation of the Accommodations as an STR, including but not limited to all occupation, franchise, excise, sales, occupancy, hotel-motel, state and federal income, and other taxes.

1.2.11 The hiring and payment of professional service providers, including attorneys, CPAs, and other similar professionals.

1.3 The term of the Program shall commence upon execution of this Agreement and shall continue indefinitely until terminated by one of the Parties. Subscriber and Host may terminate this Agreement on 60 days' advance Notice. On receipt of a termination Notice from Subscriber under this provision, Host may continue the Program until the "Termination Date," which shall be (1) 60 days after receipt of the Notice; or (2) the completion of all stays in the Accommodations that have been booked by one or more Guests up to and including the date Host received the Notice. On a termination of this Agreement by Subscriber under this provision, Host shall be entitled to payment of all costs and charges this Agreement authorizes, up to and including the Termination Date.`,
  },
  {
    heading: "2. Program Fees",
    body: `2.1 Subscriber is responsible for paying the fees specified in this Section, referred to collectively as "Program Fees."

2.2 Subscription Fee. The Subscription Fee is fifteen percent (15%) of Gross Rental Income. "Gross Rental Income" means the Accommodation fare, Extra person fees, Weekly discounts (as they affect the Accommodation fare), any markup or markdown applied to the Accommodation fare, and Booking Site / platform fees (including host service fees and similar platform charges). The Subscription Fee is calculated on Gross Rental Income without first subtracting the platform fee. Gross Rental Income does not include cleaning fees or taxes. Host does not charge the Subscription Fee on the cleaning fee. Gross Rental Income also does not include any other fees that are allocated one hundred percent (100%) to Host under the parties' PMS commission settings (including, without limitation, early check-in fees, Electronics Fees, and markups on fees).

The Subscription Fee is calculated and recognized at check-out only when Gross Rental Income is actually received. On canceled reservations where no Gross Rental Income is received, Host is not entitled to any Subscription Fee.

All refunds, discounts, or credits issued to Guests are the sole financial responsibility of Subscriber and shall not reduce Gross Rental Income for purposes of calculating the Subscription Fee. Subscriber shall reimburse Host for any such amounts within ten (10) days.

Host may adjust the listed Accommodation fare (including any markup) as needed to offset changes in Booking Site fees. Such adjustments are included in Gross Rental Income.

2.3 Technology Fee. The Technology Fee is Fifty and 00/100 Dollars ($50.00) per month, charged for each distinct premises, defined as a dwelling unit that contains the Minimum Accommodations and is separated from other dwelling units by a locked door (called a "Property," "Unit," or "Door"). The Technology Fee includes access to the Pricing Software and software licenses for WiFi locks.

2.4 Hourly Charges for Special Services. Host may be willing in certain circumstances to perform additional services not included in the Program ("Special Services"). Those Special Services may include setting up and staging the Accommodations; meeting and coordinating contractors and/or vendors; hiring and coordinating decorators and/or photographers; and similar work. Host's rate for Special Services is presently $65.00 per hour, subject to change. If Subscriber requests that Host perform Special Services, and Host agrees to perform them, Host's fee for Special Services will be included in the next succeeding monthly invoice, which will specify the number of hours Host spent performing the Special Services.

2.5 Payment of the Program Fee. Host will invoice Subscriber monthly for Host's Fee. Invoices will be delivered by email, are due on receipt, and must be paid by ACH transfer or credit card unless Host agrees otherwise in writing. Subscriber shall be responsible for providing an active and functional email address that is monitored daily for the receipt of Notices and invoices. The unpaid balance of every invoice not paid in full by the 10th day after receipt shall accrue interest at a rate equal to the lesser of 18% per annum or the maximum rate of interest allowed by law.

2.6 Independent Contractor Status. Subscriber agrees that Host is providing the Program as an independent contractor and not as an employee or agent of Subscriber.`,
  },
  {
    heading: "3. Minimum Accommodations | Amenities",
    body: `3.1 Minimum Accommodations. Subscriber understands and agrees that Host cannot provide the Program unless Subscriber has fully supplied, equipped, and furnished the Accommodations. Host will not proceed with the Program unless and until Subscriber has provided the Minimum Accommodations. Minimum Accommodations include linens and towels sufficient for three (3) turnovers, in quantities enough for the maximum number of occupants allowed by fire-code occupancy for the Accommodations.

3.2 Preparing for Guests. In preparation for the arrival of Guests, Subscriber must (1) remove all plants and candles from the Accommodations; (2) safely remove valuables from the Accommodations; (3) remove clutter and tidy the Amenities, free up space for Guests' items in cupboards, dressers, and closets, and empty the refrigerators except for condiments and unopened drinks. Subscriber may designate a locked cabinet and/or closet to store Subscriber's personal belongings; however, all items left in the Accommodations will be at Subscriber's sole risk.

3.3 Amenities. Subscriber understands that the marketability of the Accommodations will be affected by several factors, one of which is the availability of desirable features and amenities (referred to collectively as the "Amenities"). The inclusion of one or more Amenities is at Subscriber's sole cost, responsibility, and risk. Subscriber shall be solely responsible for maintaining the Amenities. It is further Subscriber's responsibility to consult with Subscriber's insurance carrier, attorney, and other persons for advice on required or desirable warning signage and other advisory materials and information, and to convey that information and those requirements for Host to follow. Amenities Subscriber may wish to consider making available to Guests include: clothes-washing machine and dryer; televisions equipped with streaming devices; WiFi access; propane fire pit; propane barbecue grill and grilling utensils; golf carts, kayaks, canoes, bicycles, and other conveyances; fishing poles; playground equipment; workout and gym equipment; saunas; mini-golf courses; billiards, arcade games, and other novelties; and private or community hot tub, swimming pool, and/or swim-spa.`,
  },
  {
    heading: "4. Release | Indemnity | Insurance | Waiver of Subrogation",
    body: `4.1 Host is not the owner of the Accommodations and is not in control of them. Subscriber therefore acknowledges that it is impossible for Host to control or identify all conditions that may be present in the Accommodations or the activities of individuals in or around the Accommodations and understands Host is not assuming responsibility to do so. Subscriber therefore acknowledges that potential safety and health hazards may be present in and around the Accommodations and recognizes the practical limitations on Host's ability to limit the risk of personal injury and property damage through controlling the activities of all persons whose actions may affect the safety of the Accommodations. Host is not, therefore, responsible for identifying or warning others about dangerous latent and patent artificial conditions in and around the Accommodations. Subscriber shall be solely responsible for ensuring the safety of Guests and all other persons who Subscriber permits to access and/or occupy the Accommodations, use any Amenities, and for warning those persons about the potential safety and health hazards present in and around the Accommodations.

4.2 Subscriber (1) acknowledges that Subscriber is solely responsible for all vehicles, belongings, and other personal property that Subscriber or Subscriber's licensees and invitees choose to bring into the Accommodations (collectively, the "Personal Property"); and (2) understands Host is not responsible for destruction of or damage to any Personal Property and does not provide insurance for Personal Property.

4.3 To the maximum extent allowed by law, Subscriber agrees to (a) release Host from all claims, demands, and causes of action, including reasonable attorneys' fees (collectively referred to as "Damages") arising in favor of Subscriber, and (b) as specified in this section, defend and hold Host and Host's officers, directors, members, managers, shareholders, employees, agents, subcontractors, attorneys, and affiliated persons and entities (collectively, the "Host Parties") free and harmless from and against all Damages arising in favor of third parties, including but not limited to Guests, their licensees and invitees, and owners and occupants of, and guests visiting, properties and premises adjacent to or in the vicinity of the Accommodations.

The release and indemnity in the preceding sentence applies to Damages for bodily injury, death, or loss of or damage to property occurring on, in, or about the Accommodations, or arising out of a Guest stay or the condition of the Accommodations or the Amenities. Subscriber—not Host—is responsible for those claims by Guests and other third parties, and shall defend, indemnify, and hold the Host Parties harmless against them.

4.4 Insurance Requirements. Subscriber agrees to maintain the following types and minimum levels of insurance coverage. These requirements are not a representation by Host regarding the adequacy or appropriateness of the coverage, but are the minimum insurance standards necessary under this Agreement:

4.4.1 Commercial fire and all-risk insurance covering the full replacement cost of the Accommodations.

4.4.2 Periodic Insurance Review (optional). At Subscriber's option, Host may help coordinate a periodic insurance review with an insurance professional to obtain updated quotes. Host is not required to provide this review unless Subscriber requests it. Any such review is not a representation by Host that coverage is adequate. Costs of quotes, premiums, and policy changes remain Subscriber's sole responsibility.

4.5 Waiver of Liability for Personal Injury and Property Damage. To the extent that Subscriber has insurance coverage for personal injury or loss or damage to the Accommodations or their contents ("Personal Property"), Subscriber agrees to waive any rights against Host for insured damages, including any insured loss or damage arising from negligence or other fault of either party, regardless of whether an insurance claim is filed for such losses.`,
  },
  {
    heading: "5. General Provisions",
    body: `5.1 Entire Agreement. This Agreement comprises the entire agreement and understanding between Host and Subscriber with respect to the Program and may not be superseded or changed by evidence of any prior, contemporaneous, or later oral agreement. This Agreement may not be amended except in a writing executed by Host and Subscriber. The Agreement may be executed in two or more identical counterparts, each of which shall be deemed an original instrument enforceable against the Party who executed it and all of which shall, when taken together, constitute one and the same instrument. Electronic signatures and reproductions of "wet-ink" signatures sent by email, fax, or other electronic means shall be deemed originals. The persons executing this instrument each represent and warrant that they are duly authorized to execute and deliver this Agreement on behalf of the persons and entities they purport to represent.

5.2 No Partnership. This Agreement represents an arms-length transaction between the Parties. The Parties do not intend for the transaction this Agreement contemplates to be a partnership or joint venture. This Agreement does not call for the Parties to share profits or losses as partners. Host has no authority to act on Subscriber's behalf except as provided in this Agreement; Subscriber has no authority whatsoever to act on behalf of Host.

5.3 Not a Real Estate Agent or Property Manager. Subscriber understands that Host is not a licensed real estate agent and is not holding itself out as one. Host is acting on behalf of Subscriber to provide the Program only. Subscriber waives and releases all present and future claims Subscriber may have against Host under any law that would require or purport to require Host to hold a license as a real estate agent or property manager before providing the Program under this Agreement. Subscriber further agrees to indemnify, defend, and hold Host free and harmless from all loss, damage, and liability arising out of or in any way related to Host's provision of the Program before becoming licensed as a real estate agent or property manager.

5.4 Severability of Provisions. Every provision of this Agreement is intended to be severable. If any term or provision hereof is illegal or invalid for any reason whatsoever, such illegality or invalidity will not affect the validity of the remainder of this Agreement and the illegal or invalid provision will be enforced to the maximum extent possible to still be legal and valid.

5.5 Notices. Any notice, demand, or request (collectively, a "Notice") that is permitted, required, or desired to be given in connection with this Agreement must be in writing and hand delivered or sent by email. If hand-delivered, the Notice shall be deemed effective when received by the addressee or other occupant (over the age of 18) or left in a mail receptacle or affixed to the front door at the street address each Party has provided below their respective signatures. Properly addressed Notices sent by email shall be deemed effective when transmitted to the addressee. Each Party shall provide a current street address and a valid and functional email address that is monitored daily for the receipt of Notices. The Parties shall be permitted to change their mailing address and/or email address on 30 days' advance Notice to the other Party. When more than one person is the Subscriber, the giving of Notice under this Section to any single Subscriber constitutes Notice to all Subscribers. REFUSAL TO ACCEPT DELIVERY OR TRANSMISSION OF ANY NOTICE SHALL BE DEEMED ACTUAL NOTICE AND ACTUAL KNOWLEDGE OF THE CONTENTS OF THE NOTICE.

5.6 Dispute Resolution and Waiver of Jury Trial. The Parties desire prompt, inexpensive, efficient dispute-resolution procedures and therefore agree to attempt to resolve through direct discussions all controversies, claims (and any related settlements), and matters in question arising out of or relating to (a) this Agreement, (b) any breach of or questions as to the interpretation of this Agreement, (c) any acts or omissions by either Party (and their officers, directors, employees, agents, subcontractors, or affiliated persons or entities, if any), and/or (d) any actual or purported express or implied representations or warranties relating to Host or this Agreement (collectively, a "Dispute"). If the Parties desire to mediate, the mediation must be conducted under the Commercial Mediation Rules of the American Arbitration Association (the "AAA"). All Disputes not resolved by direct discussions and/or mediation must be submitted to a court of competent jurisdiction in the State of Missouri for a bench trial. The Parties knowingly, intelligently, and voluntarily agree to waive their respective rights to a jury trial and agree that this provision constitutes prima facie evidence of each Party's written consent to submit all Disputes to a bench trial.

5.7 Attorneys' Fees. If Host, Subscriber, or Guest brings any legal action to enforce or interpret the provisions of this Agreement, Host will be entitled to receive from Subscriber the reasonable attorneys' fees, costs, and expenses Host incurred in prosecuting or defending a claim, in addition to any other relief to which Host may be entitled.`,
  },
  {
    heading: "Signatures",
    body: `IN WITNESS WHEREOF, the Parties have executed this Agreement as of the Start Date.

SUBSCRIBER
Signature (typed name): [SIGNATURE_NAME]
Printed name: [SUBSCRIBER_NAME]
Date: [SIGNATURE_DATE]

CO-SUBSCRIBER (if any)
Signature (typed name): [CO_SIGNATURE_NAME]
Printed name: [CO_SUBSCRIBER_NAME]
Date: [CO_SIGNATURE_DATE]

HOST: Summers Vacations LLC
Brian Summers, Authorized Person
(Host countersigns after receipt.)`,
  },
];

export function renderedAgreement(fields: ContractFields): string {
  return AGREEMENT_SECTIONS.map((s) => {
    const body = fill(s.body, fields);
    return s.heading ? `${s.heading}\n\n${body}` : body;
  }).join("\n\n");
}
