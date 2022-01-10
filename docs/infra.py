from diagrams import Diagram, Cluster, Edge
from diagrams.aws.compute import Lambda
from diagrams.aws.database import Dynamodb, DynamodbTable
from diagrams.aws.integration import Eventbridge
from diagrams.aws.network import APIGatewayEndpoint, APIGateway

from diagrams.aws.management import CloudwatchEventTimeBased

from diagrams.saas.chat import Telegram
from diagrams.aws.management import SystemsManagerParameterStore, CloudformationTemplate, Cloudformation
from diagrams.onprem.ci import GithubActions

with Diagram("Telegram Music Bot infrastructure", show=False):
    # TODO: add CI/CD parts here once gh actions is in place
    # GithubActions("CI/CD")\
    #     >> CloudformationTemplate("Template")\
    #     >> [SystemsManagerParameterStore("Parameters"), Cloudformation("CF Stack")]

    with Cluster("App"):
        links_table = DynamodbTable("Links")

        Telegram("Bot commands")\
            - APIGatewayEndpoint("/processMessages")\
            - Lambda("processMessages")\
            >> links_table

        CloudwatchEventTimeBased("Schedule")\
            >> Lambda("processQueue")\
            >> [links_table, Telegram("Music channel")]
