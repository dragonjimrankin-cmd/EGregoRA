/* The moment this build was made, in ISO form, for dateModified in the
   structured data. A separate file so templates can say {{ buildDate }}. */
export default new Date().toISOString();
