Hello,

Thank you for your efforts to follow our guidelines. There are still some issues that need your attention.

If you have any questions, we are here to help. Reply to this message in App Store Connect and let us know.


Review Environment

Submission ID: 7988d14e-2fb5-487f-8242-d4da06dca875
Review date: October 27, 2025
Version reviewed: 1.1


Guideline 3.1.2 - Business - Payments - Subscriptions

Issue Description

The submission did not include all the required information for apps offering auto-renewable subscriptions.

The app's metadata is missing the following required information:

- A functional link to the Terms of Use (EULA). If you are using the standard Apple Terms of Use (EULA), include a link to the Terms of Use in the App Description. If you are using a custom EULA, add it in App Store Connect.

Next Steps

Update the metadata to include the information specified above.

Resources

Apps offering auto-renewable subscriptions must include all of the following required information in the binary:

- Title of auto-renewing subscription (this may be the same as the in-app purchase product name)
- Length of subscription
- Price of subscription, and price per unit if appropriate
- Functional links to the privacy policy and Terms of Use (EULA)

The app metadata must also include functional links to the privacy policy in the Privacy Policy field in App Store Connect and the Terms of Use (EULA) in the App Description or EULA field in App Store Connect.

Review Schedule 2 of the Apple Developer Program License Agreement to learn more.


Guideline 2.1 - Information Needed


We need additional information about how the app uses face data. Face data is sensitive user information that must be handled properly to protect the user's security and privacy.

Next Steps

Provide complete and detailed responses to the following questions:

- What face data does the app collect?
- Provide a complete and clear explanation of all planned uses of the collected face data.
- Will the face data be shared with any third parties? Where will this information be stored?
- How long will face data be retained? 
- Where in the privacy policy is the app's collection, use, disclosure, sharing, and retention of face data explained? Identify the specific sections in the privacy policy where this information is located.

Support

- Reply to this message in your preferred language if you need assistance. If you need additional support, use the Contact Us module.
- Consult with fellow developers and Apple engineers on the Apple Developer Forums.
- Provide feedback on this message and your review experience by completing a short survey.


Hello,

Thank you for your efforts to follow our guidelines. There are still some issues that need your attention.

If you have any questions, we are here to help. Reply to this message in App Store Connect and let us know.


Review Environment

Submission ID: beae0ddb-1f0d-45ac-b3ff-3fbaa452b9fc
Review date: November 17, 2025
Version reviewed: 1.3


Guideline 4.1 - Design - Copycats


The app or its metadata appears to contain potentially misleading references to third-party content.

Specifically, the app includes content that leverages the popularity of Jennie Kim without the necessary authorization.

Next Steps

If you have the necessary rights to distribute an app with this third-party content, attach documentary evidence in the App Review Information section in App Store Connect and reply to this message. 

If you do not have the necessary rights to the third-party content, It would be appropriate to revise the app and metadata to remove the third-party content before resubmitting for review. 

Resources

Learn more about requirements to prevent apps from impersonating other apps or services in guideline 4.1.


Guideline 2.1 - Performance - App Completeness


We found that your in-app purchase products exhibited one or more bugs which create a poor user experience. 

Specifically, when we attempted to obtain any in-app purchases, we are presented with an error message. 

Review device details: 

- Device type: iPad Air (5th generation) 
- OS version: iPadOS 26.1

Next Steps

When validating receipts on your server, your server needs to be able to handle a production-signed app getting its receipts from Apple’s test environment. The recommended approach is for your production server to always validate receipts against the production App Store first. If validation fails with the error code "Sandbox receipt used in production," you should validate against the test environment instead.


Guideline 2.1 - Performance - App Completeness


We are unable to complete the review of the app because one or more of the in-app purchase products have not been submitted for review.

Specifically, the app includes references to 美美币 and 月度会员 but the associated in-app purchase products have not been submitted for review. 

Next Steps

To resolve this issue, please be sure to take action and submit your in-app purchases and upload a new binary in App Store Connect so we can proceed with our review. 

Note you must provide an App Review screenshot in App Store Connect in order to submit in-app purchases for review. Learn more about required in-app purchase metadata.

Resources 

Learn more about how to offer in-app purchases in App Store Connect Developer Help.


Guideline 5.1.1 - Legal - Privacy - Data Collection and Storage


We noticed the app includes features and functionality that use face data but the provided privacy policy does not include the following required information: 

- An explicit statement that face data is not retained. 
- Your reasons for storing face data.
- The length of time face data is stored and why you store it this specific length of time. Note that it is not appropriate to store face data indefinitely. 
- Which third parties you share face data with.
- Your reasons for sharing face data with third parties. 
- Whether or not the third parties you share face data with also store face data. If they do store face data, your privacy policy must describe the privacy practices of these third parties, including why they store face data, the length of time the face data will be stored, and why the face data will be stored for this length of time. 

To protect the user's security and privacy, developers must provide privacy policies that thoroughly explain their app's data collection and storage practices.

Next Steps

To resolve this issue, update your privacy policy to include all the required information and then provide a link to your updated privacy policy in the App Privacy section for this app in App Store Connect. If your privacy policy already includes this information, respond to this message with the relevant sections quoted in your reply.

Resources

- Learn how to update your privacy policy in App Store Connect. 
- Learn more about requirements for privacy policies in guideline 5.1.1(i).


Guideline 5.1.1(v) - Data Collection and Storage

Issue Description

The app supports account creation but does not include an option to initiate account deletion. Apps that support account creation must also offer account deletion to give users more control of the data they've shared while using an app.

Follow these requirements when updating an app to support account deletion:

- Only offering to temporarily deactivate or disable an account is insufficient.
- If users need to visit a website to finish deleting their account, include a link directly to the website page where they can complete the process.
- Apps may include confirmation steps to prevent users from accidentally deleting their account. However, only apps in highly-regulated industries may require users to use customer service resources, such as making a phone call or sending an email, to complete account deletion.

Next Steps

Update the app to support account deletion. If the app already supports account deletion, reply to App Review in App Store Connect and identify where to locate this feature.

If the app is unable to offer account deletion or needs to provide additional customer service flows to facilitate and confirm account deletion, either because the app operates in a highly-regulated industry or for some other reason, reply to App Review in App Store Connect and provide additional information or documentation. For questions regarding legal obligations, check with legal counsel.

Resources

Review frequently asked questions and learn more about the account deletion requirements.

Support

- Reply to this message in your preferred language if you need assistance. If you need additional support, use the Contact Us module.
- Consult with fellow developers and Apple engineers on the Apple Developer Forums.
- Request an App Review Appointment at Meet with Apple to discuss your app's review. Appointments subject to availability during your local business hours on Tuesdays and Thursdays.
- Provide feedback on this message and your review experience by completing a short survey.

Request a phone call from App Review

At your request, we can arrange for an Apple Representative to call you within the next three to five business days to discuss your App Review issue.

Request a call to discuss your app's review

申请应用审核团队致电联系

如果您有需要，我们将根据您的要求在三到五个工作日内安排一位精通中文的苹果公司代表致电与您联系，讨论您的应用审核结果。

申请应用审核团队致电联系