Hello,

Thank you for your efforts to follow our guidelines. There are still some issues that need your attention.

If you have any questions, we are here to help. Reply to this message in App Store Connect and let us know.

Review Environment

Submission ID: beae0ddb-1f0d-45ac-b3ff-3fbaa452b9fc
Review date: November 10, 2025
Version reviewed: 1.2


Guideline 5.1.1 - Legal - Privacy - Data Collection and Storage

Issue Description

One or more purpose strings in the app do not sufficiently explain the use of protected resources. Purpose strings must clearly and completely describe the app's use of data and, in most cases, provide an example of how the data will be used.

Next Steps

Update the camera purpose string to explain how the app will use the requested information and provide a specific example of how the data will be used. See the attached screenshot.

Resources

Purpose strings must clearly describe how an app uses the ability, data, or resource. The following are hypothetical examples of unclear purpose strings that would not pass review: 

- "App would like to access your Contacts"
- "App needs microphone access"

See examples of helpful, informative purpose strings.


Guideline 5.1.1 - Legal - Privacy - Data Collection and Storage


We noticed the app includes features and functionality that use face data but the provided privacy policy, https://xuhanpeace.github.io/facegolow-support/,does not include the following required information: 

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


Guideline 2.1 - Performance - App Completeness


We found that your in-app purchase products exhibited one or more bugs which create a poor user experience. 

Specifically, the number of coins was not updated after we had successfully purchased them. Please review the details and resources below and complete the next steps.

Review device details: 

- Device type: iPad Air (5th generation) 
- OS version: iPadOS 26.0.1

Next Steps

When validating receipts on your server, your server needs to be able to handle a production-signed app getting its receipts from Apple’s test environment. The recommended approach is for your production server to always validate receipts against the production App Store first. If validation fails with the error code "Sandbox receipt used in production," you should validate against the test environment instead.

Resources

- Note that in-app purchases do not need to have been previously approved to confirm they function correctly in review.
- Note that the Account Holder must accept the Paid Apps Agreement in the Business section of App Store Connect before paid in-app purchases will function.
- Learn how to set up and test in-app purchase products in the sandbox environment.
- Learn more about validating receipts with the App Store.

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